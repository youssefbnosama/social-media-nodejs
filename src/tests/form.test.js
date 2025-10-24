import app from "../../app";
import request from "supertest";
import User from "../models/User";

describe("POST /api/register", () => {
  const newUser = {
    username: "testuser",
    email: "test@example.com",
    password: "Password123",
  };

  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/api/register")
      .send(newUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User registered successfully");
    expect(res.body.data.user).toHaveProperty("id");
    expect(res.body.data.user.username).toBe(newUser.username);
    expect(res.body.data.user.email).toBe(newUser.email);
    expect(res.body.data.user).toHaveProperty("createdAt");

    // Verify user is saved in the database
    const userInDb = await User.findById(res.body.data.user.id);
    expect(userInDb).not.toBeNull();
    expect(userInDb?.username).toBe(newUser.username);
    expect(userInDb?.email).toBe(newUser.email);
    expect(userInDb?.password).not.toBe(newUser.password);
  });

  it("should return 400 if username is missing", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ email: "test2@example.com", password: "Password123" })
      .expect(400);

    // If username is completely missing, express-validator skips, Mongoose validation catches it.
    expect(res.body.status).toBe("fail"); // Default status for Mongoose errors
    expect(res.body.statusCode).toBe(400); // Default status code for Mongoose errors
    expect(res.body.isOperational).toBe(true); // Default for all errors in errorHandler
    expect(res.body.message).toContain("");
  });

  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ username: "testuser2", password: "Password123" })
      .expect(400); // Mongoose validation error

    expect(res.body.status).toBe("fail");
    expect(res.body.isOperational).toBe(true);
    expect(res.body.message).toContain("Please provide a valid email address");
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ username: "testuser2", email: "test2@example.com" })
      .expect(400); // Mongoose validation error

    expect(res.body.status).toBe("fail");
    expect(res.body.isOperational).toBe(true);
    expect(res.body.message).toContain(
      "Password must be at least 6 characters long"
    );
  });

  it("should return 400 for invalid email format", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ ...newUser, email: "invalid-email" })
      .expect(400);

    expect(res.body.status).toBe("fail");
    expect(res.body.isOperational).toBe(true);
    expect(res.body.message).toContain("Please provide a valid email address");
  });

  it("should return 400 with all relevant error messages for multiple invalid fields", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ username: "u", email: "invalid-email", password: "pw" })
      .expect(400);

    expect(res.body.status).toBe("fail");
    expect(res.body.isOperational).toBe(true);
    expect(res.body.message).toContain(
      "Username must be between 3 and 30 characters"
    );
    expect(res.body.message).toContain(
      "Username must be between 3 and 30 characters"
    );
    expect(res.body.message).toContain(
      "Username must be between 3 and 30 characters"
    );
  });

  it("should return 400 for password less than 6 characters", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ ...newUser, password: "short" })
      .expect(400);

    expect(res.body.status).toBe("fail");
    expect(res.body.isOperational).toBe(true);
    expect(res.body.message).toContain(
      "Password must be at least 6 characters long"
    );
  });

  it("should return 400 if email already exists", async () => {
    // Register the first user
    await request(app).post("/api/register").send(newUser).expect(201);

    // Attempt to register another user with the same email
    const res = await request(app)
      .post("/api/register")
      .send({ ...newUser, username: "anotheruser" })
      .expect(400);

    expect(res.body.status).toBe("fail");
    expect(res.body.isOperational).toBe(true);
    expect(res.body.message).toContain("Email already exists");
  });

  it("should return 400 if username already exists", async () => {
    // Register the first user
    await request(app).post("/api/register").send(newUser).expect(201);

    // Attempt to register another user with the same username
    const res = await request(app)
      .post("/api/register")
      .send({ ...newUser, email: "another@example.com" })
      .expect(400);

    expect(res.body.status).toBe("fail");
    expect(res.body.isOperational).toBe(true);
    expect(res.body.message).toContain("Username already exists");
  });
});

describe("POST /api/login", () => {
  let existingUser;
  beforeEach(async () => {
    await User.deleteMany();

    existingUser = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: "Password123",
    });
  });
  it("should login successfully and set access and refresh token cookies", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "test@example.com", password: "Password123" })
      .expect(200);

    // Check for success response
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.user).toHaveProperty("email", existingUser.email);
    expect(res.body.data?.user).not.toHaveProperty("password");

    // Check for cookies in the header
    const cookies = res.headers["set-cookie"];
    expect(Array.isArray(cookies)).toBe(true); // Ensure it's an array
    expect(cookies.length).toBeGreaterThanOrEqual(2); // Expect 2 or more cookies
    expect(cookies.some((cookie) => cookie.startsWith("accessToken="))).toBe(
      true
    );
    expect(cookies.some((cookie) => cookie.startsWith("refreshToken="))).toBe(
      true
    );
  });

  it("should return 401 if email does not exist", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "nonexistent@example.com", password: "Password123" })
      .expect(401);

    expect(res.body.status).toBe("fail");
    expect(res.body.message).toBe("There in no user with this Email...");
  });

  it("should return 401 if password does not match", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "test@example.com", password: "WrongPassword" })
      .expect(401);

    expect(res.body.status).toBe("fail");
    expect(res.body.message).toBe("Password doesn't match");
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "test@example.com" })
      .expect(400);

    expect(res.body.status).toBe("fail");
    expect(res.body.message).toContain("Password is required");
  });

  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ password: "Password123" })
      .expect(400);

    expect(res.body.status).toBe("fail");
    expect(res.body.message).toContain("Please provide a valid email address");
  });
});

describe("POST /api/logout", () => {
  let existingUser;
  beforeEach(async () => {
    await User.deleteMany(); // Clean up users before each test
    existingUser = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: "Password123", // This password will be hashed by the User model's pre-save hook
    });
  });

  it("should logout successfully and clear access and refresh tokens cookies", async () => {
    const agent = request.agent(app); // Use a Supertest agent to maintain session cookies across requests

    // 1. Log in to obtain cookies
    await agent
      .post("/api/login")
      .send({
        email: existingUser.email,
        password: "Password123",
      })
      .expect(200);

    // 2. Perform the logout request
    const res = await agent.post("/api/logout").expect(200);

    // 3. Assert the response status and message
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Logout successful");

    // 4. Check the 'Set-Cookie' headers to ensure accessToken and refreshToken are cleared
    const cookies = res.headers["set-cookie"];
    expect(Array.isArray(cookies)).toBe(true);
    expect(cookies.length).toBeGreaterThanOrEqual(2); // Expect at least 2 cookies (accessToken, refreshToken)

    const accessTokenCookie = cookies.find((cookieStr) =>
      cookieStr.startsWith("accessToken=")
    );
    const refreshTokenCookie = cookies.find((cookieStr) =>
      cookieStr.startsWith("refreshToken=")
    );

    expect(accessTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toBeDefined();
  });
});
