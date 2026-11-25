import React, { useState, useEffect, useMemo, useId, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Search,
  UserCheck,
  BookOpen,
  IndianRupee,
  X,
  Check,
  AlertCircle,
  Loader2,
  Receipt,
} from "lucide-react";
import NativeModalDialog from "./NativeModalDialog";
import userApi from "../../../api/userApi";
import { getCourses, getCourseById } from "../../../api/courseApi";
import paymentApi from "../../../api/paymentApi";
import api from "../../../api/axios";
import {
  PAYMENT_METHODS,
  INSTALLMENT_PRESETS,
  computeGstBreakup,
  computeRemainingBalance,
  computeUserDiscountFromFee,
  filterCompletedPaymentsForCourse,
  formatCurrencyINR,
  resolveCoursePrice,
} from "../../../utils/paymentFormatters";

const getInitialFormState = () => ({
  courseId: "",
  course: "",
  installmentLabel: "Full Course Fee",
  totalCourseFee: "",
  discountAmount: "0",
  paymentAmount: "",
  paymentMethod: "upi",
  transactionId: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  status: "completed",
  phone: "",
  address: "",
  gstRate: "18",
  gstInclusive: true,
  companyGstin: "",
  studentGstin: "",
  notes: "",
});

export default function AddPaymentModal({
  open,
  onClose,
  onSuccess,
  initialUserId = "",
}) {
  const titleId = useId();
  const fieldPrefix = useId();

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("student");
  const [selectedUser, setSelectedUser] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [showUserPicker, setShowUserPicker] = useState(true);

  const [formData, setFormData] = useState(getInitialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchingPricing, setFetchingPricing] = useState(false);
  const [studentPayments, setStudentPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const activeUserIdRef = useRef("");
  const activeCourseIdRef = useRef("");
  const discountManualRef = useRef(false);
  const paymentManualRef = useRef(false);
  const latestFormRef = useRef(formData);
  const latestSelectedUserRef = useRef(selectedUser);
  const latestStudentPaymentsRef = useRef(studentPayments);

  latestFormRef.current = formData;
  latestSelectedUserRef.current = selectedUser;
  latestStudentPaymentsRef.current = studentPayments;

  const mergeCoursesIntoState = (extraCourses = []) => {
    const validExtras = (Array.isArray(extraCourses) ? extraCourses : []).filter(
      (c) => c && typeof c === "object" && c._id
    );
    if (validExtras.length === 0) return;

    setCourses((prev) => {
      const map = new Map(prev.map((c) => [String(c._id), c]));
      let changed = false;
      for (const extra of validExtras) {
        const key = String(extra._id);
        const existing = map.get(key);
        if (!existing) {
          map.set(key, extra);
          changed = true;
        } else {
          const cleanExtra = Object.fromEntries(
            Object.entries(extra).filter(([, v]) => v !== undefined)
          );
          const merged = { ...existing, ...cleanExtra };
          if (
            merged.price !== existing.price ||
            merged.originalPrice !== existing.originalPrice ||
            merged.isFree !== existing.isFree ||
            merged.title !== existing.title
          ) {
            map.set(key, merged);
            changed = true;
          }
        }
      }
      if (!changed) return prev;
      return Array.from(map.values()).sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
    });
  };

  // Load Users & Courses when modal opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const loadDirectoryData = async () => {
      try {
        setLoadingDirectory(true);
        const [usersRes, allCoursesRes] = await Promise.all([
          userApi.getUsers(),
          api
            .get("/courses", {
              params: {
                all: "true",
                fields: "_id,title,price,originalPrice,isFree,isPublished",
              },
            })
            .then((res) => res.data)
            .catch(() => getCourses("all=true", true)),
        ]);
        if (cancelled) return;

        const userList = Array.isArray(usersRes)
          ? usersRes
          : usersRes?.data || usersRes?.users || [];
        const courseList = Array.isArray(allCoursesRes)
          ? allCoursesRes
          : allCoursesRes?.data || allCoursesRes?.courses || [];

        const sortedCourses = [...courseList].sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        );

        setUsers(userList);
        setCourses(sortedCourses);

        if (initialUserId) {
          const match = userList.find(
            (u) => String(u._id) === String(initialUserId)
          );
          if (match) {
            selectStudentFromList(match, sortedCourses);
          }
        }
      } catch (err) {
        console.error("Failed to load user/course directory:", err);
        toast.error("Failed to load students or courses from database");
      } finally {
        if (!cancelled) setLoadingDirectory(false);
      }
    };

    loadDirectoryData();
    return () => {
      cancelled = true;
    };
  }, [open, initialUserId]);

  const resetModalState = () => {
    activeUserIdRef.current = "";
    activeCourseIdRef.current = "";
    discountManualRef.current = false;
    paymentManualRef.current = false;
    setFetchingPricing(false);
    setLoadingHistory(false);
    setStudentPayments([]);
    latestStudentPaymentsRef.current = [];
    setUserSearch("");
    setRoleFilter("student");
    setSelectedUser(null);
    latestSelectedUserRef.current = null;
    setEnrolledCourseIds(new Set());
    setShowUserPicker(true);
    const initial = getInitialFormState();
    setFormData(initial);
    latestFormRef.current = initial;
    setErrors({});
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetModalState();
    onClose();
  };

  const applyCourseSelection = (
    courseObj,
    userObj = latestSelectedUserRef.current,
    { preserveManual = false } = {}
  ) => {
    if (!courseObj) return;
    activeCourseIdRef.current = String(courseObj._id || "");
    if (!preserveManual) {
      discountManualRef.current = false;
      paymentManualRef.current = false;
    }

    const baseFee = resolveCoursePrice(courseObj);
    const { discountAmount: computedDiscount } = computeUserDiscountFromFee(
      baseFee,
      userObj?.discount
    );
    const priorPaidForCourse = filterCompletedPaymentsForCourse(
      latestStudentPaymentsRef.current,
      courseObj._id,
      courseObj.title
    ).reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);

    setFormData((prev) => {
      const nextTotalFee = String(baseFee);
      const effectiveDiscount =
        preserveManual && discountManualRef.current
          ? Math.max(0, Number(prev.discountAmount || 0))
          : computedDiscount;
      const effectiveNetPayable = computeRemainingBalance(
        baseFee,
        effectiveDiscount,
        priorPaidForCourse,
        0
      );

      return {
        ...prev,
        courseId: courseObj._id,
        course: courseObj.title || prev.course || "",
        totalCourseFee: nextTotalFee,
        discountAmount:
          preserveManual && discountManualRef.current
            ? prev.discountAmount
            : String(computedDiscount),
        paymentAmount:
          preserveManual && paymentManualRef.current
            ? prev.paymentAmount
            : String(effectiveNetPayable),
      };
    });
    setErrors((prev) => ({
      ...prev,
      course: undefined,
      paymentAmount: undefined,
    }));
  };

  const selectStudentFromList = async (user, availableCourses = courses) => {
    const userId = String(user._id);
    activeUserIdRef.current = userId;
    setSelectedUser(user);
    latestSelectedUserRef.current = user;
    setShowUserPicker(false);
    setErrors((prev) => ({ ...prev, user: undefined }));

    // Collect enrolled course IDs & any populated course objects from user record
    const populatedCourses = (
      Array.isArray(user.enrolledCourses) ? user.enrolledCourses : []
    ).filter((c) => c && typeof c === "object" && c._id);
    mergeCoursesIntoState(populatedCourses);

    const ids = new Set(
      (Array.isArray(user.enrolledCourses) ? user.enrolledCourses : [])
        .map((c) => (typeof c === "object" ? c?._id : c))
        .filter(Boolean)
        .map(String)
    );
    setEnrolledCourseIds(new Set(ids));

    // Pre-fill contact info & sync discount immediately if totalCourseFee is already set
    setFormData((prev) => {
      const hasFee = prev.totalCourseFee !== "" && !Number.isNaN(Number(prev.totalCourseFee));
      if (!hasFee || discountManualRef.current) {
        return {
          ...prev,
          phone: user.phone || prev.phone || "",
          address: user.address || prev.address || "",
        };
      }
      const { discountAmount: dAmt, netPayable } = computeUserDiscountFromFee(
        prev.totalCourseFee,
        user.discount
      );
      return {
        ...prev,
        phone: user.phone || prev.phone || "",
        address: user.address || prev.address || "",
        discountAmount: String(dAmt),
        paymentAmount: paymentManualRef.current ? prev.paymentAmount : String(netPayable),
      };
    });

    setStudentPayments([]);
    latestStudentPaymentsRef.current = [];
    setLoadingHistory(true);

    try {
      const [userRes, enrollRes, historyRes] = await Promise.allSettled([
        userApi.getById(user._id),
        api.get(`/enrollments/user/${user._id}`),
        paymentApi.getStudentPaymentHistory({
          userId: user._id,
          email: user.email || "",
        }),
      ]);

      if (activeUserIdRef.current !== userId) return;

      const fetchedHistory =
        historyRes.status === "fulfilled" && historyRes.value?.success
          ? historyRes.value.payments || []
          : [];
      setStudentPayments(fetchedHistory);
      latestStudentPaymentsRef.current = fetchedHistory;

      let effectiveUser = user;
      if (userRes.status === "fulfilled" && userRes.value) {
        const rawUser = userRes.value?.data || userRes.value;
        if (rawUser && rawUser._id) {
          effectiveUser = { ...user, ...rawUser };
          setSelectedUser(effectiveUser);
          latestSelectedUserRef.current = effectiveUser;
          setUsers((prev) =>
            prev.map((u) => (String(u._id) === userId ? { ...u, ...effectiveUser } : u))
          );

          const freshPopulated = (
            Array.isArray(effectiveUser.enrolledCourses)
              ? effectiveUser.enrolledCourses
              : []
          ).filter((c) => c && typeof c === "object" && c._id);
          mergeCoursesIntoState(freshPopulated);
          freshPopulated.forEach((c) => ids.add(String(c._id)));
        }
      }

      const enrollmentPopulated = [];
      if (enrollRes.status === "fulfilled") {
        const list = enrollRes.value?.data?.data || enrollRes.value?.data || [];
        if (Array.isArray(list)) {
          list.forEach((e) => {
            if (e.course && typeof e.course === "object" && e.course._id) {
              enrollmentPopulated.push(e.course);
            }
            const cid =
              (typeof e.course === "object" ? e.course?._id : e.course) || e.courseId;
            if (cid) ids.add(String(cid));
          });
        }
      }
      mergeCoursesIntoState(enrollmentPopulated);
      setEnrolledCourseIds(new Set(ids));

      const combinedCourses = [
        ...availableCourses,
        ...populatedCourses,
        ...enrollmentPopulated,
      ];
      const currentForm = latestFormRef.current;

      if (currentForm.courseId || (currentForm.totalCourseFee !== "" && !Number.isNaN(Number(currentForm.totalCourseFee)))) {
        const priorPaid = filterCompletedPaymentsForCourse(
          fetchedHistory,
          currentForm.courseId,
          currentForm.course
        ).reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);

        setFormData((prev) => {
          const nextPhone = prev.phone || effectiveUser.phone || "";
          const nextAddress = prev.address || effectiveUser.address || "";
          const feeNum = Number(prev.totalCourseFee);
          if (Number.isNaN(feeNum) || prev.totalCourseFee === "") {
            return { ...prev, phone: nextPhone, address: nextAddress };
          }
          const nextDiscount = discountManualRef.current
            ? Math.max(0, Number(prev.discountAmount) || 0)
            : computeUserDiscountFromFee(feeNum, effectiveUser.discount).discountAmount;
          const nextNetPayable = computeRemainingBalance(feeNum, nextDiscount, priorPaid, 0);
          return {
            ...prev,
            phone: nextPhone,
            address: nextAddress,
            discountAmount: discountManualRef.current ? prev.discountAmount : String(nextDiscount),
            paymentAmount: paymentManualRef.current ? prev.paymentAmount : String(nextNetPayable),
          };
        });
      } else if (!currentForm.course && ids.size === 1) {
        // Auto-pick single enrolled course if no course chosen yet
        const singleId = Array.from(ids)[0];
        const matchedCourse = combinedCourses.find((c) => String(c._id) === singleId);
        if (matchedCourse) {
          applyCourseSelection(matchedCourse, effectiveUser);
        }
      }
    } finally {
      if (activeUserIdRef.current === userId) {
        setLoadingHistory(false);
      }
    }
  };

  const handleCourseSelectChange = async (e) => {
    const val = e.target.value;
    if (!val) {
      activeCourseIdRef.current = "";
      discountManualRef.current = false;
      paymentManualRef.current = false;
      setFormData((prev) => ({
        ...prev,
        courseId: "",
        course: "",
        totalCourseFee: "",
        discountAmount: "0",
        paymentAmount: "",
      }));
      return;
    }
    if (val === "__custom__") {
      activeCourseIdRef.current = "";
      setFormData((prev) => ({ ...prev, courseId: "", course: "" }));
      return;
    }

    activeCourseIdRef.current = String(val);
    const matched = courses.find((c) => String(c._id) === String(val));
    if (matched) {
      applyCourseSelection(matched, latestSelectedUserRef.current);
    }

    // Fetch latest Course price & fresh User discount in parallel so edits are always reflected
    try {
      setFetchingPricing(true);
      const activeUser = latestSelectedUserRef.current;
      const [courseRes, userRes] = await Promise.allSettled([
        getCourseById(val),
        activeUser?._id ? userApi.getById(activeUser._id) : Promise.resolve(null),
      ]);

      if (activeCourseIdRef.current !== String(val)) return;

      let freshCourse = matched;
      if (courseRes.status === "fulfilled" && courseRes.value) {
        const extracted = courseRes.value?.data || courseRes.value;
        if (extracted && extracted._id) {
          freshCourse = { ...matched, ...extracted };
          mergeCoursesIntoState([freshCourse]);
        }
      }

      let freshUser = latestSelectedUserRef.current;
      if (
        userRes.status === "fulfilled" &&
        userRes.value &&
        activeUser?._id &&
        String(latestSelectedUserRef.current?._id) === String(activeUser._id)
      ) {
        const extractedUser = userRes.value?.data || userRes.value;
        if (extractedUser && extractedUser._id) {
          freshUser = { ...freshUser, ...extractedUser };
          setSelectedUser(freshUser);
          latestSelectedUserRef.current = freshUser;
          setUsers((prev) =>
            prev.map((u) =>
              String(u._id) === String(freshUser._id) ? { ...u, ...freshUser } : u
            )
          );
        }
      }

      if (freshCourse) {
        applyCourseSelection(freshCourse, freshUser, { preserveManual: true });
      }
    } finally {
      setFetchingPricing(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === "student" && (u.role || "").toLowerCase() !== "student") {
        return false;
      }
      if (!q) return true;
      return (
        (u.fullname || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (u.studentId || "").toLowerCase().includes(q)
      );
    });
  }, [users, userSearch, roleFilter]);

  const { enrolledCourses, otherCourses } = useMemo(() => {
    const enrolled = [];
    const others = [];
    for (const c of courses) {
      if (enrolledCourseIds.has(String(c._id))) {
        enrolled.push(c);
      } else {
        others.push(c);
      }
    }
    return { enrolledCourses: enrolled, otherCourses: others };
  }, [courses, enrolledCourseIds]);

  const gstBreakup = useMemo(
    () =>
      computeGstBreakup(
        formData.paymentAmount,
        Number(formData.gstRate || 0),
        formData.gstInclusive
      ),
    [formData.paymentAmount, formData.gstRate, formData.gstInclusive]
  );

  const matchingPreviousPayments = useMemo(
    () =>
      selectedUser
        ? filterCompletedPaymentsForCourse(
            studentPayments,
            formData.courseId,
            formData.course
          )
        : [],
    [selectedUser, studentPayments, formData.courseId, formData.course]
  );

  const previouslyPaidAmount = useMemo(
    () =>
      Number(
        matchingPreviousPayments
          .reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0)
          .toFixed(2)
      ),
    [matchingPreviousPayments]
  );

  const totalStudentPaidAllCourses = useMemo(
    () =>
      Number(
        studentPayments
          .filter((p) => (p.status || "").toLowerCase() === "completed")
          .reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0)
          .toFixed(2)
      ),
    [studentPayments]
  );

  const netBeforeCurrentPayment = useMemo(
    () =>
      computeRemainingBalance(
        formData.totalCourseFee,
        formData.discountAmount,
        previouslyPaidAmount,
        0
      ),
    [formData.totalCourseFee, formData.discountAmount, previouslyPaidAmount]
  );

  // Keep default Amount Received synced with remaining balance (Fee - Discount - Previously Paid)
  useEffect(() => {
    if (!open || paymentManualRef.current) return;
    if (formData.totalCourseFee === "" || Number.isNaN(Number(formData.totalCourseFee))) {
      return;
    }
    const nextStr = String(netBeforeCurrentPayment);
    setFormData((prev) =>
      String(prev.paymentAmount) === nextStr ? prev : { ...prev, paymentAmount: nextStr }
    );
  }, [open, netBeforeCurrentPayment, formData.totalCourseFee]);

  const computedBalance = useMemo(
    () =>
      computeRemainingBalance(
        formData.totalCourseFee,
        formData.discountAmount,
        previouslyPaidAmount,
        formData.paymentAmount
      ),
    [
      formData.totalCourseFee,
      formData.discountAmount,
      previouslyPaidAmount,
      formData.paymentAmount,
    ]
  );

  const expectedUserDiscount = useMemo(() => {
    const { discountAmount } = computeUserDiscountFromFee(
      formData.totalCourseFee,
      selectedUser?.discount
    );
    return discountAmount;
  }, [formData.totalCourseFee, selectedUser?.discount]);

  const handleFieldChange = (name, value) => {
    const prevPaidNow = filterCompletedPaymentsForCourse(
      latestStudentPaymentsRef.current,
      latestFormRef.current.courseId,
      name === "course" ? value : latestFormRef.current.course
    ).reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);

    if (name === "totalCourseFee") {
      setFormData((prev) => {
        if (discountManualRef.current) {
          if (paymentManualRef.current || value === "") {
            return { ...prev, totalCourseFee: value };
          }
          const customDiscount = Math.max(0, Number(prev.discountAmount) || 0);
          const nextNet = computeRemainingBalance(value, customDiscount, prevPaidNow, 0);
          return { ...prev, totalCourseFee: value, paymentAmount: String(nextNet) };
        }
        const { discountAmount: dAmt } = computeUserDiscountFromFee(
          value,
          latestSelectedUserRef.current?.discount
        );
        const nextNet = computeRemainingBalance(value, dAmt, prevPaidNow, 0);
        return {
          ...prev,
          totalCourseFee: value,
          discountAmount: value === "" ? "0" : String(dAmt),
          paymentAmount: paymentManualRef.current
            ? prev.paymentAmount
            : value === ""
            ? ""
            : String(nextNet),
        };
      });
    } else if (name === "discountAmount") {
      discountManualRef.current = true;
      setFormData((prev) => {
        if (paymentManualRef.current || prev.totalCourseFee === "") {
          return { ...prev, discountAmount: value };
        }
        const nextNet = computeRemainingBalance(
          prev.totalCourseFee,
          value,
          prevPaidNow,
          0
        );
        return { ...prev, discountAmount: value, paymentAmount: String(nextNet) };
      });
    } else if (name === "paymentAmount") {
      paymentManualRef.current = true;
      setFormData((prev) => ({ ...prev, paymentAmount: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleApplyUserDiscount = () => {
    discountManualRef.current = false;
    const prevPaidNow = previouslyPaidAmount;
    setFormData((prev) => {
      const { discountAmount: dAmt } = computeUserDiscountFromFee(
        prev.totalCourseFee,
        latestSelectedUserRef.current?.discount
      );
      const nextNet = computeRemainingBalance(prev.totalCourseFee, dAmt, prevPaidNow, 0);
      return {
        ...prev,
        discountAmount: String(dAmt),
        paymentAmount: paymentManualRef.current ? prev.paymentAmount : String(nextNet),
      };
    });
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!selectedUser) {
      nextErrors.user = "Please select a student from the user database.";
    }
    if (!formData.course.trim()) {
      nextErrors.course = "Please select or enter a course name.";
    }
    const amt = Number(formData.paymentAmount);
    if (!amt || Number.isNaN(amt) || amt <= 0) {
      nextErrors.paymentAmount = "Please enter a valid paid amount greater than ₹0.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please check the highlighted required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        userId: selectedUser._id,
        name: selectedUser.fullname,
        email: selectedUser.email,
        phone: formData.phone.trim() || selectedUser.phone || "Not provided",
        address: formData.address.trim() || selectedUser.address || "Not provided",
        courseId: formData.courseId || null,
        course: formData.course.trim(),
        installmentLabel: formData.installmentLabel.trim() || "Full Course Fee",
        totalCourseFee: formData.totalCourseFee !== "" ? Number(formData.totalCourseFee) : null,
        discountAmount: Number(formData.discountAmount || 0),
        previouslyPaidAmount,
        balanceDue: computedBalance,
        paymentAmount: Number(formData.paymentAmount),
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId.trim(),
        paymentDate: formData.paymentDate
          ? new Date(formData.paymentDate).toISOString()
          : new Date().toISOString(),
        status: formData.status,
        gstRate: Number(formData.gstRate ?? 18),
        gstInclusive: formData.gstInclusive,
        companyGstin: formData.companyGstin.trim().toUpperCase(),
        studentGstin: formData.studentGstin.trim().toUpperCase(),
        notes: formData.notes.trim(),
      };

      const res = await paymentApi.createAdminPayment(payload);
      if (res?.success) {
        toast.success(`Payment added (${res.payment?.invoiceNumber || "Saved"})!`);
        const created = res.payment;
        resetModalState();
        onSuccess(created);
      } else {
        throw new Error(res?.message || "Failed to add payment");
      }
    } catch (err) {
      console.error("Error adding payment:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to save payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <NativeModalDialog
      open={open}
      onClose={handleClose}
      titleId={titleId}
      closedBy={isSubmitting ? "none" : "any"}
      maxWidthClass="max-w-3xl"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-950 to-indigo-800 px-6 py-4 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20">
            <Receipt className="h-5 w-5 text-indigo-100" />
          </div>
          <div>
            <h1 id={titleId} className="text-lg font-bold leading-tight">
              Add Student Payment
            </h1>
            <p className="text-xs text-indigo-200 mt-0.5">
              Select a student from the user database, record payment details &amp; generate GST invoice
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          aria-label="Close Add Payment dialog"
          className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Form Body */}
      <form
        method="post"
        onSubmit={handleSubmit}
        noValidate
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/40"
      >
        {/* STEP 1: Select Student from User Database */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                1
              </span>
              <h2 className="text-sm font-bold text-gray-900">
                Select Student from User Database <span className="text-red-500">*</span>
              </h2>
            </div>
            {selectedUser && !showUserPicker && (
              <button
                type="button"
                onClick={() => setShowUserPicker(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Change Student
              </button>
            )}
          </div>

          {selectedUser && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {(selectedUser.fullname || "S").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      {selectedUser.fullname}
                    </span>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 capitalize">
                      {selectedUser.role || "student"}
                    </span>
                    {selectedUser.discount > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {selectedUser.discount}% User Discount
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{selectedUser.email}</p>
                  {enrolledCourseIds.size > 0 && (
                    <p className="text-[11px] text-indigo-700 mt-1 font-medium">
                      Enrolled in {enrolledCourseIds.size} course{enrolledCourseIds.size > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg self-start sm:self-center">
                <UserCheck className="h-3.5 w-3.5" />
                Selected
              </div>
            </div>
          )}

          {showUserPicker && (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id={`${fieldPrefix}-student-search`}
                    type="search"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search student by name, email, phone, or student ID..."
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRoleFilter("student")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      roleFilter === "student"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Students
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter("all")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      roleFilter === "all"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    All Users
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100 bg-white">
                {loadingDirectory ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    Loading users from database...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500">
                    No users found matching &ldquo;{userSearch}&rdquo;. Try switching to &ldquo;All Users&rdquo;.
                  </div>
                ) : (
                  filteredUsers.slice(0, 60).map((u) => {
                    const isSelected = selectedUser?._id === u._id;
                    const courseCount = Array.isArray(u.enrolledCourses)
                      ? u.enrolledCourses.length
                      : 0;
                    return (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => selectStudentFromList(u)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-indigo-50/70 ${
                          isSelected ? "bg-indigo-50" : ""
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {u.fullname || "Unnamed User"}
                            </span>
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 capitalize">
                              {u.role || "student"}
                            </span>
                            {courseCount > 0 && (
                              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                {courseCount} course{courseCount > 1 ? "s" : ""}
                              </span>
                            )}
                            {Number(u.discount) > 0 && (
                              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                {u.discount}% discount
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {u.email}
                            {u.phone ? ` • ${u.phone}` : ""}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {errors.user && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600" role="alert">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.user}
            </p>
          )}

          {/* Billing contact details once student is picked */}
          {selectedUser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label
                  htmlFor={`${fieldPrefix}-phone`}
                  className="block text-xs font-semibold text-gray-700 mb-1"
                >
                  Student Phone (for Invoice)
                </label>
                <input
                  id={`${fieldPrefix}-phone`}
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor={`${fieldPrefix}-studentGstin`}
                  className="block text-xs font-semibold text-gray-700 mb-1"
                >
                  Student / Org GSTIN <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id={`${fieldPrefix}-studentGstin`}
                  name="studentGstin"
                  type="text"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={formData.studentGstin}
                  onChange={(e) => handleFieldChange("studentGstin", e.target.value.toUpperCase())}
                  placeholder="e.g. 07AABCU9603R1ZM"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase font-mono text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor={`${fieldPrefix}-address`}
                  className="block text-xs font-semibold text-gray-700 mb-1"
                >
                  Billing Address <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id={`${fieldPrefix}-address`}
                  name="address"
                  rows={2}
                  autoComplete="street-address"
                  value={formData.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  placeholder="City, State, PIN Code"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </section>

        {/* STEP 2: Course & Fee / GST Details */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                2
              </span>
              <h2 className="text-sm font-bold text-gray-900">
                Course &amp; Fee Details (Incl. 18% GST)
              </h2>
            </div>
            {fetchingPricing && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700">
                <Loader2 className="h-3 w-3 animate-spin" />
                Syncing price &amp; user discount...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={`${fieldPrefix}-courseSelect`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Select Course <span className="text-red-500">*</span>
              </label>
              <select
                id={`${fieldPrefix}-courseSelect`}
                name="courseId"
                value={formData.courseId || (formData.course ? "__custom__" : "")}
                onChange={handleCourseSelectChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose a Course --</option>
                {enrolledCourses.length > 0 && (
                  <optgroup label="Student's Enrolled Courses">
                    {enrolledCourses.map((c) => {
                      const coursePrice = resolveCoursePrice(c);
                      return (
                        <option key={c._id} value={c._id}>
                          ★ {c.title}{" "}
                          {coursePrice > 0
                            ? `(₹${coursePrice.toLocaleString("en-IN")})`
                            : "(Free)"}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
                <optgroup label={enrolledCourses.length > 0 ? "Other Courses" : "All Courses"}>
                  {otherCourses.map((c) => {
                    const coursePrice = resolveCoursePrice(c);
                    return (
                      <option key={c._id} value={c._id}>
                        {c.title}{" "}
                        {coursePrice > 0
                          ? `(₹${coursePrice.toLocaleString("en-IN")})`
                          : "(Free)"}
                      </option>
                    );
                  })}
                </optgroup>
                <option value="__custom__">Custom Course / Program Title...</option>
              </select>
            </div>

            <div>
              <label
                htmlFor={`${fieldPrefix}-courseTitle`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Course Name on Invoice <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id={`${fieldPrefix}-courseTitle`}
                  name="course"
                  type="text"
                  required
                  aria-invalid={Boolean(errors.course)}
                  value={formData.course}
                  onChange={(e) => handleFieldChange("course", e.target.value)}
                  placeholder="e.g. SAP FICO Certification Training"
                  className={`w-full rounded-lg border pl-9 pr-3 py-2 text-sm text-gray-900 focus:outline-none ${
                    errors.course
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-indigo-500"
                  }`}
                />
              </div>
              {errors.course && (
                <p className="mt-1 text-xs text-red-600">{errors.course}</p>
              )}
            </div>
          </div>

          {/* Payment Purpose / Installment */}
          <div>
            <label
              htmlFor={`${fieldPrefix}-installment`}
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              Payment Purpose / Installment Label
            </label>
            <input
              id={`${fieldPrefix}-installment`}
              name="installmentLabel"
              type="text"
              value={formData.installmentLabel}
              onChange={(e) => handleFieldChange("installmentLabel", e.target.value)}
              placeholder="e.g. Full Course Fee or 1st Installment"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {INSTALLMENT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleFieldChange("installmentLabel", preset)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-colors ${
                    formData.installmentLabel === preset
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor={`${fieldPrefix}-totalFee`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Total Program Fee (₹) <span className="text-gray-400 font-normal">(auto)</span>
              </label>
              <input
                id={`${fieldPrefix}-totalFee`}
                name="totalCourseFee"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={formData.totalCourseFee}
                onChange={(e) => handleFieldChange("totalCourseFee", e.target.value)}
                placeholder="e.g. 25000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
              {formData.courseId && formData.totalCourseFee !== "" && (
                <p className="mt-1 text-[11px] text-indigo-700 font-medium">
                  Course price fetched
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <label
                  htmlFor={`${fieldPrefix}-discount`}
                  className="block text-xs font-semibold text-gray-700"
                >
                  Discount (₹)
                </label>
                {selectedUser && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      Number(selectedUser.discount) > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {Number(selectedUser.discount || 0)}% User
                  </span>
                )}
              </div>
              <input
                id={`${fieldPrefix}-discount`}
                name="discountAmount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={formData.discountAmount}
                onChange={(e) => handleFieldChange("discountAmount", e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
              {selectedUser &&
                Number(selectedUser.discount) > 0 &&
                Number(formData.totalCourseFee) > 0 &&
                Number(formData.discountAmount || 0) !== expectedUserDiscount && (
                  <button
                    type="button"
                    onClick={handleApplyUserDiscount}
                    className="mt-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    Apply {selectedUser.discount}% user discount (₹
                    {expectedUserDiscount.toLocaleString("en-IN")})
                  </button>
                )}
            </div>

            <div>
              <label
                htmlFor={`${fieldPrefix}-paidAmount`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Amount Received (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  id={`${fieldPrefix}-paidAmount`}
                  name="paymentAmount"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.01"
                  required
                  aria-invalid={Boolean(errors.paymentAmount)}
                  value={formData.paymentAmount}
                  onChange={(e) => handleFieldChange("paymentAmount", e.target.value)}
                  placeholder="e.g. 15000"
                  className={`w-full rounded-lg border pl-8 pr-3 py-2 text-sm font-bold text-gray-900 focus:outline-none ${
                    errors.paymentAmount
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-indigo-500"
                  }`}
                />
              </div>
              {errors.paymentAmount && (
                <p className="mt-1 text-xs text-red-600">{errors.paymentAmount}</p>
              )}
              {!errors.paymentAmount &&
                Number(formData.totalCourseFee) > 0 &&
                previouslyPaidAmount > 0 &&
                netBeforeCurrentPayment === 0 && (
                  <p className="mt-1 text-[11px] font-medium text-amber-700">
                    Course fee already fully paid earlier (
                    {formatCurrencyINR(previouslyPaidAmount, true)} received)
                  </p>
                )}
            </div>
          </div>

          {/* Student's Previously Received Payments Banner */}
          {selectedUser && (loadingHistory || matchingPreviousPayments.length > 0 || totalStudentPaidAllCourses > 0) && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs space-y-1.5">
              {loadingHistory ? (
                <div className="flex items-center gap-2 text-emerald-800">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Checking student&apos;s earlier payments...</span>
                </div>
              ) : matchingPreviousPayments.length > 0 ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-emerald-900">
                      Already Paid Earlier ({matchingPreviousPayments.length} payment
                      {matchingPreviousPayments.length > 1 ? "s" : ""} for this course):{" "}
                      {formatCurrencyINR(previouslyPaidAmount, true)}
                    </span>
                    {Number(formData.totalCourseFee) > 0 && (
                      <span className="font-semibold text-indigo-800">
                        Payable Now: {formatCurrencyINR(netBeforeCurrentPayment, true)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchingPreviousPayments.slice(0, 4).map((p) => (
                      <span
                        key={p._id}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-0.5 text-[11px] text-emerald-900 font-medium"
                      >
                        <span className="font-mono">{p.invoiceNumber || "Paid"}</span>
                        <span>•</span>
                        <span>{formatCurrencyINR(p.paymentAmount)}</span>
                        <span className="text-emerald-600">
                          (
                          {new Date(p.paymentDate || p.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short" }
                          )}
                          )
                        </span>
                      </span>
                    ))}
                    {matchingPreviousPayments.length > 4 && (
                      <span className="text-[11px] text-emerald-700 self-center">
                        +{matchingPreviousPayments.length - 4} more
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-emerald-800">
                  No earlier completed payment for this course (Other courses paid by
                  student: {formatCurrencyINR(totalStudentPaidAllCourses, true)})
                </div>
              )}
            </div>
          )}

          {/* GST Breakup Live Summary + Optional Company GSTIN */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                18% GST Inclusive Breakup Preview
              </span>
              <div className="flex items-center gap-3 text-xs">
                <label htmlFor={`${fieldPrefix}-gstRate`} className="text-gray-600 font-medium">
                  GST %:
                </label>
                <select
                  id={`${fieldPrefix}-gstRate`}
                  name="gstRate"
                  value={formData.gstRate}
                  onChange={(e) => handleFieldChange("gstRate", e.target.value)}
                  className="rounded border border-indigo-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-800"
                >
                  <option value="18">18% GST (Standard)</option>
                  <option value="12">12% GST</option>
                  <option value="5">5% GST</option>
                  <option value="0">0% (No GST)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-lg bg-white p-2 border border-indigo-100/80">
                <span className="text-gray-500 block">Taxable Base</span>
                <span className="font-bold text-gray-900">
                  {formatCurrencyINR(gstBreakup.taxableValue, true)}
                </span>
              </div>
              <div className="rounded-lg bg-white p-2 border border-indigo-100/80">
                <span className="text-gray-500 block">CGST ({gstBreakup.cgstRate}%)</span>
                <span className="font-bold text-gray-900">
                  {formatCurrencyINR(gstBreakup.cgstAmount, true)}
                </span>
              </div>
              <div className="rounded-lg bg-white p-2 border border-indigo-100/80">
                <span className="text-gray-500 block">SGST ({gstBreakup.sgstRate}%)</span>
                <span className="font-bold text-gray-900">
                  {formatCurrencyINR(gstBreakup.sgstAmount, true)}
                </span>
              </div>
              <div className="rounded-lg bg-indigo-900 p-2 text-white">
                <span className="text-indigo-200 block">Total Paid</span>
                <span className="font-extrabold">
                  {formatCurrencyINR(gstBreakup.grandTotal, true)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <label htmlFor={`${fieldPrefix}-companyGstin`} className="text-gray-600 font-medium whitespace-nowrap">
                  Inxyme GSTIN (opt):
                </label>
                <input
                  id={`${fieldPrefix}-companyGstin`}
                  name="companyGstin"
                  type="text"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={formData.companyGstin}
                  onChange={(e) => handleFieldChange("companyGstin", e.target.value.toUpperCase())}
                  placeholder="Optional company GSTIN"
                  className="rounded border border-indigo-200 bg-white px-2.5 py-1 text-xs font-mono uppercase text-gray-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              {Number(formData.totalCourseFee) > 0 && (
                <div className="text-right">
                  {previouslyPaidAmount > 0 && (
                    <span className="text-[11px] text-emerald-700 font-medium mr-2">
                      Prev. Paid: {formatCurrencyINR(previouslyPaidAmount, true)} •
                    </span>
                  )}
                  <span className="font-semibold text-amber-800">
                    Balance Remaining: {formatCurrencyINR(computedBalance, true)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* STEP 3: Payment Mode & Reference */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              3
            </span>
            <h2 className="text-sm font-bold text-gray-900">Payment Mode &amp; Transaction Reference</h2>
          </div>

          <fieldset>
            <legend className="text-xs font-semibold text-gray-700 mb-2">
              Payment Mode <span className="text-red-500">*</span>
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const inputId = `${fieldPrefix}-mode-${m.value}`;
                const checked = formData.paymentMethod === m.value;
                return (
                  <label
                    key={m.value}
                    htmlFor={inputId}
                    className={`flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all ${
                      checked
                        ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={checked}
                      onChange={(e) => handleFieldChange("paymentMethod", e.target.value)}
                      className="mt-0.5 accent-indigo-600"
                    />
                    <div className="leading-tight">
                      <span className="block text-xs font-bold text-gray-900">{m.label}</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">{m.hint}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor={`${fieldPrefix}-txnId`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Transaction / UTR / Ref ID
              </label>
              <input
                id={`${fieldPrefix}-txnId`}
                name="transactionId"
                type="text"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={formData.transactionId}
                onChange={(e) => handleFieldChange("transactionId", e.target.value)}
                placeholder="e.g. UPI432198765"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor={`${fieldPrefix}-paymentDate`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Payment Date
              </label>
              <input
                id={`${fieldPrefix}-paymentDate`}
                name="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleFieldChange("paymentDate", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor={`${fieldPrefix}-status`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Payment Status
              </label>
              <select
                id={`${fieldPrefix}-status`}
                name="status"
                value={formData.status}
                onChange={(e) => handleFieldChange("status", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="completed">Completed (Paid)</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor={`${fieldPrefix}-notes`}
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              Notes / Remarks <span className="text-gray-400 font-normal">(optional, shown on invoice)</span>
            </label>
            <textarea
              id={`${fieldPrefix}-notes`}
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              placeholder="e.g. Received via Google Pay; balance due next month."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </section>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Payment...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Payment
              </>
            )}
          </button>
        </div>
      </form>
    </NativeModalDialog>
  );
}
