const allowedFields = [
  "title",
  "description",
  "priority",
  "status",
  "dueDate",
];

const validateTaskInput = (data, { partial = false } = {}) => {
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return ["Request body must be a JSON object"];
  }

  const fields = Object.keys(data);

  if (fields.length === 0) {
    return ["Request body cannot be empty"];
  }

  const unknownFields = fields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length > 0) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }

  if (!partial && !fields.includes("title")) {
    errors.push("Title is required");
  }

  if (fields.includes("title")) {
    if (typeof data.title !== "string" || !data.title.trim()) {
      errors.push("Title must be a non-empty string");
    }
  }

  if (fields.includes("description")) {
    if (typeof data.description !== "string") {
      errors.push("Description must be a string");
    }
  }

  if (fields.includes("priority")) {
    if (!["low", "medium", "high"].includes(data.priority)) {
      errors.push("Priority must be low, medium, or high");
    }
  }

  if (fields.includes("status")) {
    if (
      !["pending", "in_progress", "completed"].includes(data.status)
    ) {
      errors.push(
        "Status must be pending, in_progress, or completed"
      );
    }
  }

  if (fields.includes("dueDate") && data.dueDate !== null) {
    if (
      typeof data.dueDate !== "string" ||
      data.dueDate.trim() === "" ||
      Number.isNaN(Date.parse(data.dueDate))
    ) {
      errors.push("Due date must be a valid date string or null");
    }
  }

  return errors;
};

export { validateTaskInput };