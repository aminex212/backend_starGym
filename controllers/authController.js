import bcrypt from "bcryptjs";
import User from "../models/User.js";
import crypto from "crypto";
import { sendEmail } from "../services/emailService.js";
import {
  clearSession,
  createSession,
  ensureCsrfToken,
} from "../middleware/sessionSecurity.js";
import { cleanEmail, cleanString, escapeHtml } from "../utils/validation.js";

export const login = async (req, res) => {
    try {
        const email = cleanEmail(req.body.email);
        const password = cleanString(req.body.password, "Password", { max: 128 });

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const csrfToken = createSession(res, user);

        res.status(200).json({
            message: "Login successful",
            csrfToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message:
                error.statusCode === 400
                    ? error.message
                    : "Unable to log in",
        });
    }
};

export const getSession = async (req, res) => {
  const user = await User.findById(req.user.id).select("name email role");

  if (!user) {
    clearSession(res);
    return res.status(401).json({ message: "Session is no longer valid" });
  }

  return res.status(200).json({
    csrfToken: ensureCsrfToken(req, res),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const logout = async (_req, res) => {
  clearSession(res);
  return res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const name = cleanString(req.body.name, "Name", { max: 100 });
        const email = cleanEmail(req.body.email);
        const password = req.body.password
          ? cleanString(req.body.password, "Password", { max: 128 })
          : "";

        if (!name || !email) {
            return res.status(400).json({
                message: "Name and email are required",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // Check if email is already used by another user
        const existingUser = await User.findOne({
            email,
            _id: { $ne: userId },
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email is already in use",
            });
        }

        user.name = name;
        user.email = email;

        // Update password only if a new one was provided
        if (password) {
            if (password.length < 8) {
                return res.status(400).json({
                    message: "Password must be at least 8 characters",
                });
            }
            user.password = await bcrypt.hash(password, 12);
        }

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message:
                error.statusCode === 400
                    ? error.message
                    : "Unable to update profile",
        });
    }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    // ما نكشفوش واش email موجود ولا لا
    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists with this email, a reset link has been sent.",
      });
    }

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the hash in database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;

    // Token valid for 15 minutes
    user.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save();

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:3000";

    const resetUrl =
      `${frontendUrl}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "StarGym - Reset Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>StarGym Fighting Academy</h2>

          <p>Hello ${escapeHtml(user.name)},</p>

          <p>
            We received a request to reset your StarGym account password.
          </p>

          <p>
            This link will expire in <strong>15 minutes</strong>.
          </p>

          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #000;
              color: #fff;
              text-decoration: none;
              border-radius: 8px;
            "
          >
            Reset Password
          </a>

          <p style="margin-top: 20px;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message:
        "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(error.statusCode || 500).json({
      message:
        error.statusCode === 400
          ? error.message
          : "Unable to process password reset request",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const token = cleanString(req.body.token, "Token", { max: 128 });
    const password = cleanString(req.body.password, "Password", { max: 128 });

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // Hash token received from frontend
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    user.password = await bcrypt.hash(password, 12);

    // Token can only be used once
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(error.statusCode || 500).json({
      message:
        error.statusCode === 400
          ? error.message
          : "Unable to reset password",
    });
  }
};
