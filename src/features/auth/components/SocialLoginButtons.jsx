import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

export default function SocialLoginButtons({ onError }) {
  const { socialLogin } = useAuth();
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  if (!googleClientId) return null;

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          try {
            await socialLogin("google", credentialResponse.credential);
          } catch {
            onError("Google Login fehlgeschlagen.");
          }
        }}
        onError={() => onError("Google Login fehlgeschlagen.")}
        width="320"
        text="continue_with"
        shape="rectangular"
        theme="outline"
      />
    </div>
  );
}
