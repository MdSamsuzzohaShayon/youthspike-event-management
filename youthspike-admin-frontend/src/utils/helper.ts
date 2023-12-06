export function isValidObjectId(docId: string) {
  // Pattern to match a valid ObjectId
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;

  // Check if the provided string matches the pattern
  return objectIdPattern.test(docId);
}
