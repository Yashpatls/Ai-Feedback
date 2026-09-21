if (typeof process !== "undefined" && process.env.NEXTAUTH_URL === "") {
  // Fix NextAuth crash on empty string
  delete process.env.NEXTAUTH_URL;
}
