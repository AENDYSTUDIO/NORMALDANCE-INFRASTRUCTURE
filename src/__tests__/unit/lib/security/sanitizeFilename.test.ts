import { sanitizeFilename } from "../sanitize";

describe("sanitizeFilename", () => {
  it("should sanitize basic filenames", () => {
    expect(sanitizeFilename("test.txt")).toBe("test.txt");
    expect(sanitizeFilename("my-file.pdf")).toBe("my-file.pdf");
    expect(sanitizeFilename("file with spaces.doc")).toBe("file_with_spaces.doc");
  });

  it("should remove directory traversal sequences", () => {
    expect(sanitizeFilename("../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeFilename("../../../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeFilename("..\\..\\..\\etc\\passwd")).toBe("etc-passwd");
  });

  it("should replace special characters with underscores", () => {
    expect(sanitizeFilename("file*name?.txt")).toBe("file_name_.txt");
    expect(sanitizeFilename("file<name>.txt")).toBe("file_name_.txt");
    expect(sanitizeFilename('file"name.txt')).toBe("file_name.txt");
  });

  it("should replace slashes with dashes", () => {
    expect(sanitizeFilename("path/to/file.txt")).toBe("path-to-file.txt");
    expect(sanitizeFilename("path\\to\\file.txt")).toBe("path-to-file.txt");
  });

  it("should replace colons with dashes", () => {
    expect(sanitizeFilename("file:name.txt")).toBe("file-name.txt");
  });

  it("should remove leading special characters", () => {
    expect(sanitizeFilename("...file.txt")).toBe("file.txt");
    expect(sanitizeFilename("-file.txt")).toBe("file.txt");
    expect(sanitizeFilename("_file.txt")).toBe("file.txt");
    expect(sanitizeFilename(".file.txt")).toBe("file.txt");
  });

  it("should collapse multiple dashes or underscores", () => {
    expect(sanitizeFilename("file---name.txt")).toBe("file-name.txt");
    expect(sanitizeFilename("file___name.txt")).toBe("file_name.txt");
  });

  it("should limit filename length", () => {
    const longName = "a".repeat(300) + ".txt";
    const result = sanitizeFilename(longName);
    expect(result.length).toBe(255);
  });

  it("should handle non-string inputs", () => {
    // @ts-ignore
    expect(sanitizeFilename(null)).toBe("");
    // @ts-ignore
    expect(sanitizeFilename(undefined)).toBe("");
    // @ts-ignore
    expect(sanitizeFilename(123)).toBe("");
  });

  it("should handle empty strings", () => {
    expect(sanitizeFilename("")).toBe("");
  });
});