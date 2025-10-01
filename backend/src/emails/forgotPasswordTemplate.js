export const forgotPasswordTemplate = ({ userName, resetURL, resetTokenExpiresInMinutes }) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #ddd; }
        .header h2 { color: #4f46e5; }
        .content { text-align: center; padding: 20px 0; }
        .button { display: inline-block; padding: 12px 25px; margin: 25px 0; font-size: 16px; font-weight: bold; color: #fff !important; background-color: #4f46e5; border-radius: 5px; text-decoration: none; }
        .footer { text-align: center; font-size: 12px; color: #777; padding-top: 20px; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Dear ${userName},</p>
            <p>You requested a password reset. Please click the button below to set a new password.</p>
            <a href="${resetURL}" class="button">Reset Password</a>
            <p>This link is valid for ${resetTokenExpiresInMinutes} minutes. If you did not request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Auth System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;