import axios from "./axios";

// Upload course image
export const uploadCourseImage = async (formData) => {
  try {
    // Create a new instance of axios without the default JSON content-type
    const uploadAxios = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const response = await uploadAxios.post("/courses/upload-image", formData);
    return response.data;
  } catch (error) {
    console.error("Error uploading image:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

// Delete uploaded file
export const deleteUploadedFile = async (filePath) => {
  try {
    const response = await axios.delete("/courses/delete-file", {
      data: { filePath },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting file:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

// Get all courses with optional filters
// If isAdmin is true, will include unpublished courses
export const getCourses = async (queryParams = "", isAdmin = false) => {
  try {
    // Parse queryParams if it's a string
    const params =
      typeof queryParams === "string"
        ? new URLSearchParams(queryParams)
        : new URLSearchParams();

    // Add admin flag if needed
    if (isAdmin) {
      params.set("admin", "true");
    }

    // Ensure we're including all necessary fields
    params.set(
      "fields",
      "title,description,image,category,instructor,price,showOnHome,isPublished,level",
    );

    // console.log('Making API request to /courses with params:', Object.fromEntries(params));
    const response = await axios.get(`/courses?${params.toString()}`);

    // console.log('API Response data structure:', {
    //     isArray: Array.isArray(response.data),
    //     hasDataProperty: response.data && typeof response.data === 'object' && 'data' in response.data,
    //     responseKeys: response.data ? Object.keys(response.data) : 'no data'
    // });

    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data; // Direct array response
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data; // { data: [...] } format
    } else if (response.data && typeof response.data === "object") {
      // Handle case where data is an object with course IDs as keys
      return Object.values(response.data);
    }

    return [];
  } catch (error) {
    console.error("Error in getCourses:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// Get single course by ID with all necessary fields
export const getCourseById = async (id) => {
  try {
    // console.log(`Fetching course with ID: ${id}`);
    const response = await axios.get(`/courses/${id}`, {
      params: {
        fields: [
          "title",
          "description",
          "shortDescription",
          "category",
          "instructor",
          "price",
          "originalPrice",
          "discount",
          "totalHours",
          "thumbnail",
          "image",
          "rating",
          "enrolledStudents",
          "duration",
          "whatYouWillLearn",
          "requirements",
          "whoIsThisFor",
          "curriculum",
          "reviews",
          "isFeatured",
          "showOnHome",
          "slug",
          "status",
          "metaTitle",
          "metaDescription",
          "tags",
          "prerequisites",
          "skills",
          "certificateIncluded",
          "isPublished",
          "language",
          "level",
          "mentors",
          "faqs",
          "brochureUrl",
          "brochureGeneratedAt",
        ].join(","),
      },
    });
    // console.log('Course fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching course with ID ${id}:`, error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

// Helper function to clean and format course data
const prepareCourseData = (courseData) => {
  // console.log('Original course data in prepareCourseData:', JSON.stringify(courseData, null, 2));

  // Create a deep copy to avoid mutating the original data
  const cleanData = JSON.parse(JSON.stringify(courseData));

  // Ensure all array fields are present and properly formatted
  const arrayFields = [
    "benefits",
    "prerequisites",
    "skills",
    "whatYouWillLearn",
    "requirements",
    "whoIsThisFor",
    "mentors",
    "tags",
  ];

  // Process array fields
  arrayFields.forEach((field) => {
    if (courseData[field] === undefined || courseData[field] === null) {
      cleanData[field] = [];
      return;
    }

    if (Array.isArray(courseData[field])) {
      // Filter out empty strings, null, and undefined values from arrays
      cleanData[field] = courseData[field]
        .filter((item) => item !== null && item !== undefined)
        .map((item) => item.toString().trim())
        .filter((item) => item !== "");
    } else if (typeof courseData[field] === "string") {
      // If it's a string, split by newlines and clean
      cleanData[field] = courseData[field]
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item !== "");
    } else {
      cleanData[field] = [];
    }
  });

  // Ensure curriculum is properly formatted
  if (Array.isArray(cleanData.curriculum)) {
    cleanData.curriculum = cleanData.curriculum
      .filter((week) => week && (week.title || week.week))
      .map((week, index) => ({
        week: Number(week.week) || index + 1,
        title: week.title?.toString().trim() || `Week ${index + 1}`,
        description: week.description?.toString().trim() || "",
        duration: week.duration?.toString().trim() || "0 min",
        topics: Array.isArray(week.topics)
          ? week.topics
              .map((topic) => topic?.toString().trim())
              .filter((topic) => topic && topic !== "")
          : [],
      }));
  } else {
    cleanData.curriculum = [
      {
        week: 1,
        title: "Introduction",
        description: "",
        duration: "0 min",
        topics: ["Course introduction"],
      },
    ];
  }

  // If course is marked as free, ensure price is 0
  if (cleanData.isFree === true) {
    cleanData.price = 0;
    cleanData.originalPrice = 0;
  }

  // Ensure required fields have default values
  const defaults = {
    title: "Untitled Course",
    description: "",
    shortDescription: "",
    price: 0,
    originalPrice: 0,
    totalHours: 0,
    duration: "0 min",
    level: "Beginner",
    language: "English",
    certificateIncluded: true,
    isFeatured: false,
    isPublished: false,
    status: "draft",
    isFree: false, // Ensure isFree has a default value
  };

  // Handle number fields
  const numberFields = ["price", "originalPrice", "totalHours"];
  numberFields.forEach((field) => {
    cleanData[field] = Number(cleanData[field]) || 0;
  });

  // Apply defaults only for undefined/null/empty values, but preserve boolean values
  Object.entries(defaults).forEach(([key, value]) => {
    // Skip boolean fields if they are explicitly set
    const isBooleanField = [
      "isFeatured",
      "isPublished",
      "certificateIncluded",
    ].includes(key);
    if (isBooleanField && cleanData[key] !== undefined) {
      return; // Keep the existing boolean value
    }

    // For non-boolean fields, apply defaults if empty
    if (
      cleanData[key] === undefined ||
      cleanData[key] === null ||
      cleanData[key] === ""
    ) {
      cleanData[key] = value;
    }
  });

  // Ensure required arrays are never empty
  if (!cleanData.benefits || cleanData.benefits.length === 0) {
    cleanData.benefits = ["No specific benefits listed"];
  }
  if (!cleanData.prerequisites || cleanData.prerequisites.length === 0) {
    cleanData.prerequisites = ["No prerequisites required"];
  }
  if (!cleanData.whatYouWillLearn || cleanData.whatYouWillLearn.length === 0) {
    cleanData.whatYouWillLearn = ["Learn valuable skills"];
  }
  if (!cleanData.requirements || cleanData.requirements.length === 0) {
    cleanData.requirements = ["No special requirements"];
  }
  if (!cleanData.whoIsThisFor || cleanData.whoIsThisFor.length === 0) {
    cleanData.whoIsThisFor = ["Anyone interested in learning"];
  }
  if (!cleanData.skills || cleanData.skills.length === 0) {
    cleanData.skills = ["No specific skills required"];
  }

  // Ensure curriculum has at least one week
  if (
    !cleanData.curriculum ||
    !Array.isArray(cleanData.curriculum) ||
    cleanData.curriculum.length === 0
  ) {
    cleanData.curriculum = [
      {
        week: 1,
        title: "Introduction",
        description: "",
        duration: "0 min",
        topics: ["Course introduction"],
      },
    ];
  }

  // console.log('Prepared course data:', JSON.stringify(cleanData, null, 2));
  return cleanData;
};

// Create a new course
export const createCourse = async (courseData) => {
  try {
    // Clean and format the course data first
    const cleanData = prepareCourseData(courseData);

    // Check for required fields after processing
    const requiredFields = [
      "title",
      "description",
      "category",
      "instructor",
      "level",
    ];
    const missingFields = requiredFields.filter((field) => !cleanData[field]);

    // Only require price if the course is not free
    if (
      !cleanData.isFree &&
      (cleanData.price === undefined || cleanData.price === null)
    ) {
      missingFields.push("price");
    }

    if (missingFields.length > 0) {
      const error = new Error(
        `Missing required fields: ${missingFields.join(", ")}`,
      );
      error.name = "ValidationError";
      throw error;
    }

    // Log the exact data being sent
    // console.log('Sending to server:', JSON.stringify(cleanData, null, 2));

    const response = await axios({
      method: "post",
      url: "/courses",
      data: cleanData,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      timeout: 15000, // 15 seconds timeout
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors
    });

    // console.log('Server response status:', response.status);
    // console.log('Server response data:', response.data);

    if (response.status >= 400) {
      // Handle 4xx errors
      const errorMessage = response.data?.message || "Failed to create course";
      const errorDetails = response.data?.errors
        ? Object.entries(response.data.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join("\n")
        : "";

      throw new Error(
        `${errorMessage}${errorDetails ? "\n" + errorDetails : ""}`,
      );
    }

    const responseData = response.data;
    const responseCourseData = responseData.data || responseData;

    if (!responseCourseData) {
      throw new Error("No data received in the response from the server");
    }

    // Ensure the course ID is available
    if (!responseCourseData._id && !responseCourseData.id) {
      console.error("Invalid response - missing course ID:", responseData);
      throw new Error("The server response is missing the course ID");
    }

    return responseCourseData;
  } catch (error) {
    console.error("Error creating course:", error);

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // console.error('Response data:', error.response.data);
      // console.error('Response status:', error.response.status);
      // console.error('Response headers:', error.response.headers);

      let errorMessage = "An error occurred while saving the course";

      // Handle different types of errors
      if (error.response.status === 400 || error.response.status === 422) {
        // Validation error
        errorMessage = error.response.data.message || "Validation failed";

        // If there are validation errors, include them in the message
        if (error.response.data.errors) {
          const errorDetails = Object.entries(error.response.data.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join("\n");
          errorMessage = `Validation Error: ${errorMessage}\n${errorDetails}`;
        }
      } else if (error.response.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response.status === 403) {
        errorMessage = "You do not have permission to perform this action.";
      } else if (error.response.status === 404) {
        errorMessage = "The requested resource was not found.";
      } else if (error.response.status >= 500) {
        errorMessage = "A server error occurred. Please try again later.";
      }

      console.error("Error details:", errorMessage);
      throw new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
      throw new Error(
        "No response received from the server. Please check your internet connection.",
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error setting up the request:", error.message);
      throw new Error(`Failed to create course: ${error.message}`);
    }
  }
};

// Update a course (full or partial update)
export const updateCourse = async (id, courseData, isPartial = false) => {
  try {
    // console.log(`${isPartial ? 'Partially' : 'Fully'} updating course ${id} with data:`, courseData);

    // Helper function to clean array fields
    const cleanArrayField = (field) => {
      if (field === undefined || field === null) return [];
      if (Array.isArray(field)) {
        return field.filter((item) => item && item.trim() !== "");
      }
      if (typeof field === "string") {
        return field.split("\n").filter((item) => item.trim() !== "");
      }
      return [];
    };

    // Log the raw isFeatured value for debugging
    // console.log('Raw isFeatured value:', courseData.isFeatured, 'type:', typeof courseData.isFeatured);

    // Clean and format the data
    const cleanData = {
      ...courseData,
      // Convert numbers
      price: courseData.price !== undefined ? Number(courseData.price) : 0,
      originalPrice:
        courseData.originalPrice !== undefined
          ? Number(courseData.originalPrice)
          : 0,
      totalHours:
        courseData.totalHours !== undefined ? Number(courseData.totalHours) : 0,
      // Convert booleans - ensure they are proper booleans
      certificateIncluded: courseData.certificateIncluded !== false, // default to true if not set
      isFeatured:
        courseData.isFeatured === true || courseData.isFeatured === "true",
      isPublished:
        courseData.isPublished === true || courseData.isPublished === "true",
      // Clean array fields
      benefits: cleanArrayField(courseData.benefits),
      prerequisites: cleanArrayField(courseData.prerequisites),
      whatYouWillLearn: cleanArrayField(courseData.whatYouWillLearn),
      skills: cleanArrayField(courseData.skills),
      requirements: cleanArrayField(courseData.requirements),
      whoIsThisFor: cleanArrayField(courseData.whoIsThisFor),
      // Ensure tags is an array
      tags: Array.isArray(courseData.tags) ? courseData.tags : [],
      // Ensure curriculum is properly formatted
      curriculum: Array.isArray(courseData.curriculum)
        ? courseData.curriculum.map((week) => ({
            week: Number(week.week) || 1,
            title: week.title || "",
            description: week.description || "",
            duration: week.duration || "0 min",
            topics: Array.isArray(week.topics)
              ? week.topics.filter((t) => t && t.trim() !== "")
              : [],
          }))
        : [],
    };

    // Remove undefined values for partial updates
    const dataToSend = isPartial
      ? Object.fromEntries(
          Object.entries(cleanData).filter(([_, v]) => v !== undefined),
        )
      : cleanData;

    const method = isPartial ? "patch" : "put";
    const response = await axios[method](`/courses/${id}`, dataToSend, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      `Error ${isPartial ? "partially " : ""}updating course ${id}:`,
      error,
    );
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

// Update specific course section
export const updateCourseSection = async (id, section, sectionData) => {
  try {
    const response = await axios.patch(
      `/courses/${id}/section/${section}`,
      sectionData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating course ${id} section '${section}':`, error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

// Delete a course
export const deleteCourse = async (id) => {
  try {
    const response = await axios.delete(`/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting course ${id}:`, error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

// Get courses by category
// If no categoryId is provided, returns all published courses
export const getCoursesByCategory = async (categoryId = "") => {
  try {
    const params = {
      fields:
        "title,description,price,originalPrice,thumbnail,duration,level,instructor,rating,enrolledStudents,isFeatured,category,slug,whatYouWillLearn,requirements,whoIsThisFor,curriculum,reviews,isFeatured,status",
    };

    // Add category filter if provided
    if (categoryId) {
      params.category = categoryId;
    }

    // console.log('Fetching courses with params:', params);
    const response = await axios.get("/courses", { params });
    // console.log('Courses fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching courses by category:", error);
    throw error;
  }
};

// Get all categories for course form
// Download course brochure
export const downloadBrochure = async (courseId) => {
  try {
    const response = await axios.get(`/courses/${courseId}/download-brochure`, {
      responseType: "blob", // Important for downloading files
    });

    // Create a blob from the response
    const url = window.URL.createObjectURL(new Blob([response.data]));

    // Create a temporary anchor element to trigger the download
    const link = document.createElement("a");
    link.href = url;

    // Get the filename from the content-disposition header or use a default name
    const contentDisposition = response.headers["content-disposition"];
    let filename = "course-brochure.pdf";

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
      );
      if (filenameMatch != null && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    // Clean up
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Error downloading brochure:", error);
    throw error;
  }
};

export const getCategoriesForForm = async () => {
  try {
    // First, try with a simple query to get all categories
    const response = await axios.get("/categories");

    // Check if we have a data property with an array
    if (response.data && Array.isArray(response.data)) {
      return response.data.map((cat) => ({
        value: cat._id,
        label: cat.title || cat.name || "Unnamed Category",
      }));
    }

    // Check for nested data property
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data.map((cat) => ({
        value: cat._id,
        label: cat.title || cat.name || "Unnamed Category",
      }));
    }

    // Check for results property (some APIs use this)
    if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results.map((cat) => ({
        value: cat._id,
        label: cat.title || cat.name || "Unnamed Category",
      }));
    }

    console.warn("No categories found in the expected format");
    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};
