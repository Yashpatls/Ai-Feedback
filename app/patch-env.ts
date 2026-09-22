if (typeof process !== "undefined") {
  if (process.env.RENDER_EXTERNAL_URL) {
    process.env.NEXTAUTH_URL = process.env.RENDER_EXTERNAL_URL;
  } else if (process.env.NEXTAUTH_URL === "") {
    delete process.env.NEXTAUTH_URL;
  }
}
