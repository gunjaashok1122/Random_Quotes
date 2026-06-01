import { useTheme } from "@/contexts/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";
import { LinearGradient } from "expo-linear-gradient";
import { Eye, EyeOff, Lock, Mail, Quote, User, X } from "lucide-react-native";
import React, { useState, useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  getAdditionalUserInfo,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, googleProvider, isFirebaseConfigured, db } from "../utils/firebase";

// Official Google G Logo SVG
function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </Svg>
  );
}

interface AuthScreenProps {
  onAuthSuccess: (username: string) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Google Modal State (Fallback Mode)
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Name Prompt State (for Google Sign Up)
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [promptName, setPromptName] = useState("");
  const googleUserRef = useRef<any>(null);

  // Capture Google Sign-in redirect result on mount
  React.useEffect(() => {
    if (isFirebaseConfigured && Platform.OS === "web") {
      getRedirectResult(auth)
        .then(async (result) => {
          if (result) {
            const additionalInfo = getAdditionalUserInfo(result);
            const isNewUser = additionalInfo?.isNewUser;

            if (isNewUser || !result.user.displayName) {
              googleUserRef.current = result.user;
              setPromptName(result.user.displayName || result.user.email?.split("@")[0] || "");
              setShowNamePrompt(true);
            } else {
              const name = result.user.displayName;
              
              // Save user to Firestore Database
              try {
                await setDoc(doc(db, "users", result.user.uid), {
                  uid: result.user.uid,
                  email: result.user.email || "",
                  displayName: name,
                  provider: "google",
                  lastLoginAt: new Date().toISOString()
                }, { merge: true });
              } catch (dbErr) {
                console.error("Firestore Google redirect login error:", dbErr);
              }

              await AsyncStorage.setItem("auth-username", name);
              await AsyncStorage.setItem("auth-email", result.user.email || "");
              onAuthSuccess(name);
            }
          }
        })
        .catch((err) => {
          console.error("Google Redirect Result Error:", err);
          if (err.code === "auth/unauthorized-domain") {
            setShowGoogleChooser(true);
          } else {
            setError("Google sign-in failed: " + err.message);
          }
        });
    }
  }, []);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggleAuthMode = () => {
    setError("");
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: isSignUp ? 10 : -10,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSignUp(!isSignUp);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !username)) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isFirebaseConfigured) {
        if (isSignUp) {
          // Real Firebase Sign Up
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
              displayName: username,
            });
            
            // Save user to Firestore Database
            try {
              await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: email,
                displayName: username,
                provider: "password",
                createdAt: new Date().toISOString()
              });
            } catch (dbErr) {
              console.error("Firestore user registration error:", dbErr);
            }
          }
          await AsyncStorage.setItem("auth-username", username);
          await AsyncStorage.setItem("auth-email", email);
          onAuthSuccess(username);
        } else {
          // Real Firebase Sign In
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const finalUsername =
            userCredential.user.displayName ||
            userCredential.user.email?.split("@")[0] ||
            "User";
            
          // Save/update user to Firestore Database
          try {
            await setDoc(doc(db, "users", userCredential.user.uid), {
              uid: userCredential.user.uid,
              email: userCredential.user.email || email,
              displayName: finalUsername,
              provider: "password",
              lastLoginAt: new Date().toISOString()
            }, { merge: true });
          } catch (dbErr) {
            console.error("Firestore user login update error:", dbErr);
          }

          await AsyncStorage.setItem("auth-username", finalUsername);
          await AsyncStorage.setItem("auth-email", userCredential.user.email || email);
          onAuthSuccess(finalUsername);
        }
      } else {
        // Mock fallback
        await new Promise((resolve) => setTimeout(resolve, 800));
        const finalUsername = isSignUp ? username : email.split("@")[0];
        await AsyncStorage.setItem("auth-username", finalUsername);
        await AsyncStorage.setItem("auth-email", email);
        onAuthSuccess(finalUsername);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered.");
      } else if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Invalid email or password.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    if (isFirebaseConfigured && Platform.OS === "web") {
      setLoading(true);
      setError("");
      
      const isMobileWeb = /Mobi|Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
      
      if (isMobileWeb) {
        signInWithRedirect(auth, googleProvider)
          .catch((err) => {
            console.error("Google Redirect Error:", err);
            if (err.code === "auth/unauthorized-domain") {
              setError("");
              setShowGoogleChooser(true);
            } else {
              setError("Google Sign-In redirect failed to start.");
            }
            setLoading(false);
          });
      } else {
        signInWithPopup(auth, googleProvider)
          .then(async (result) => {
            const additionalInfo = getAdditionalUserInfo(result);
            const isNewUser = additionalInfo?.isNewUser;

            if (isNewUser || !result.user.displayName) {
              googleUserRef.current = result.user;
              setPromptName(result.user.displayName || result.user.email?.split("@")[0] || "");
              setShowNamePrompt(true);
            } else {
              const name = result.user.displayName;
              
              // Save user to Firestore Database
              try {
                await setDoc(doc(db, "users", result.user.uid), {
                  uid: result.user.uid,
                  email: result.user.email || "",
                  displayName: name,
                  provider: "google",
                  lastLoginAt: new Date().toISOString()
                }, { merge: true });
              } catch (dbErr) {
                console.error("Firestore Google popup login error:", dbErr);
              }

              await AsyncStorage.setItem("auth-username", name);
              await AsyncStorage.setItem("auth-email", result.user.email || "");
              onAuthSuccess(name);
            }
          })
          .catch((err) => {
            console.error("Google Sign-In Error:", err);
            if (err.code === "auth/unauthorized-domain") {
              setError("");
              window.alert(
                "Domain Authorization Warning:\n\nThis Netlify domain is not added to 'Authorized Domains' in your Firebase Auth Console yet. We will load the Google Chooser fallback so you can continue testing."
              );
              setShowGoogleChooser(true);
            } else if (err.code === "auth/popup-blocked") {
              setError("Sign-In popup blocked by your browser. Please allow popups.");
            } else {
              setError("Google Sign-In failed or was cancelled.");
            }
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else {
      setShowGoogleChooser(true);
    }
  };

  const handleGoogleSelect = async (name: string, userEmail: string) => {
    setGoogleLoading(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // For mock chooser: if signing up / choosing "Use another account", ask for name
      if (name === "Google User") {
        googleUserRef.current = { email: userEmail };
        setPromptName("");
        setShowGoogleChooser(false);
        setShowNamePrompt(true);
      } else {
        // Save mock chooser login to Firestore Database so they appear in Firebase
        try {
          const mockUid = "mock_" + name.toLowerCase().replace(/\s+/g, "_");
          await setDoc(doc(db, "users", mockUid), {
            uid: mockUid,
            email: userEmail,
            displayName: name,
            provider: "google_mock",
            lastLoginAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.error("Firestore Mock Google login save error:", dbErr);
        }

        await AsyncStorage.setItem("auth-username", name);
        await AsyncStorage.setItem("auth-email", userEmail);
        setShowGoogleChooser(false);
        onAuthSuccess(name);
      }
    } catch (err) {
      setError("Google Sign-In failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSavePromptName = async () => {
    const trimmedName = promptName.trim();
    if (!trimmedName) {
      return;
    }

    setLoading(true);
    try {
      const user = googleUserRef.current;
      if (user && typeof user.updateProfile === "function") {
        // If it's a real Firebase user object
        await updateProfile(user, {
          displayName: trimmedName,
        });

        // Save user to Firestore Database
        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email || "",
            displayName: trimmedName,
            provider: "google",
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error("Firestore Google signup name save error:", dbErr);
        }
      } else {
        // Mock fallback/Chooser fallback save
        try {
          const mockUid = "mock_" + Date.now();
          await setDoc(doc(db, "users", mockUid), {
            uid: mockUid,
            email: user?.email || "user@gmail.com",
            displayName: trimmedName,
            provider: "google_mock",
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error("Firestore Mock Google signup save error:", dbErr);
        }
      }
      await AsyncStorage.setItem("auth-username", trimmedName);
      if (user?.email) {
        await AsyncStorage.setItem("auth-email", user.email);
      }

      setShowNamePrompt(false);
      onAuthSuccess(trimmedName);
    } catch (err) {
      console.error("Error saving display name:", err);
      // Fallback
      await AsyncStorage.setItem("auth-username", trimmedName);
      setShowNamePrompt(false);
      onAuthSuccess(trimmedName);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <LinearGradient
        colors={["#1E1611", "#120D0A"]} // Rich deep dark gold-brown tones
        style={styles.gradient}
      >
        <View style={styles.lightBeam} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            !isMobile && styles.webScrollContent,
            isMobile && { justifyContent: "flex-start", paddingVertical: 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[
            styles.card,
            !isMobile && styles.webCard,
            isMobile && styles.mobileCard,
            { borderColor: "rgba(212, 160, 84, 0.15)" }
          ]}>
            {/* Logo Section */}
            <View style={[styles.logoSection, isMobile && styles.mobileLogoSection]}>
              <View style={[styles.quoteIconBox, isMobile && styles.mobileQuoteIconBox]}>
                <Quote size={isMobile ? 24 : 32} color="#D4A054" fill="#D4A054" strokeWidth={1} />
              </View>
              <Text style={[styles.logoTitle, isMobile && styles.mobileLogoTitle]}>Inspiring Words</Text>
              <Text style={styles.logoSubtitle}>From the successful people</Text>
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Animated Form Fields */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                width: "100%",
                gap: 16,
              }}
            >
              <Text style={styles.formTitle}>
                {isSignUp ? "Create Account" : "Welcome Back"}
              </Text>

              {isSignUp && (
                <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                  <View style={styles.inputIcon}>
                    <User size={18} color="#A89880" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#6D5E50"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              )}

              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <View style={styles.inputIcon}>
                  <Mail size={18} color="#A89880" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#6D5E50"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.inputContainer, isMobile && styles.mobileInputContainer]}>
                <View style={styles.inputIcon}>
                  <Lock size={18} color="#A89880" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#6D5E50"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureText}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setSecureText(!secureText)}
                  style={styles.eyeIcon}
                >
                  {secureText ? (
                    <EyeOff size={18} color="#A89880" />
                  ) : (
                    <Eye size={18} color="#A89880" />
                  )}
                </Pressable>
              </View>
            </Animated.View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  isMobile && styles.mobileSubmitBtn,
                  { opacity: pressed || loading ? 0.9 : 1 },
                ]}
                onPress={handleAuth}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#E8B76E", "#C8873A"]} // Amber-Gold gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnGradient}
                >
                  <Text style={styles.submitBtnText}>
                    {loading
                      ? "Processing..."
                      : isSignUp
                      ? "Create Account"
                      : "Sign In"}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.toggleBtn} onPress={toggleAuthMode}>
                <Text style={toggleTextStyles(colors)}>
                  {isSignUp
                    ? "Already have an account? Sign In"
                    : "Don't have an account? Sign Up"}
                </Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Continue with Google Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.googleBtn,
                  isMobile && styles.mobileGoogleBtn,
                  { opacity: pressed ? 0.95 : 1 },
                ]}
                onPress={handleGoogleClick}
                disabled={loading}
              >
                <GoogleIcon />
                <Text style={styles.googleText}>Continue with Google</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Google Account Chooser Modal */}
      <Modal
        visible={showGoogleChooser}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!googleLoading) setShowGoogleChooser(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, !isMobile && styles.webModalContent]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.googleHeaderLogo}>
                <GoogleIcon />
                <Text style={styles.googleBrandText}>Google</Text>
              </View>
              <Pressable
                onPress={() => setShowGoogleChooser(false)}
                disabled={googleLoading}
                hitSlop={12}
              >
                <X size={20} color="#5F6368" />
              </Pressable>
            </View>

            {googleLoading ? (
              <View style={styles.googleLoadingContainer}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={styles.googleLoadingText}>Signing in with Google...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>Choose an account</Text>
                <Text style={styles.modalSubtitle}>to continue to Random Quotes</Text>

                {/* Accounts List */}
                <View style={styles.accountList}>
                  {/* Account 1: Srikanth */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.accountItem,
                      pressed && { backgroundColor: "#F1F3F4" },
                    ]}
                    onPress={() => handleGoogleSelect("Srikanth", "srikanth@gmail.com")}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: "#E8F0FE" }]}>
                      <Text style={[styles.avatarLetter, { color: "#1A73E8" }]}>S</Text>
                    </View>
                    <View style={styles.accountDetails}>
                      <Text style={styles.accountName}>Srikanth</Text>
                      <Text style={styles.accountEmail}>srikanth@gmail.com</Text>
                    </View>
                  </Pressable>

                  {/* Account 2: Ashok */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.accountItem,
                      pressed && { backgroundColor: "#F1F3F4" },
                    ]}
                    onPress={() => handleGoogleSelect("Ashok", "ashok@gmail.com")}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: "#FEF7E0" }]}>
                      <Text style={[styles.avatarLetter, { color: "#F9AB00" }]}>A</Text>
                    </View>
                    <View style={styles.accountDetails}>
                      <Text style={styles.accountName}>Ashok</Text>
                      <Text style={styles.accountEmail}>ashok@gmail.com</Text>
                    </View>
                  </Pressable>

                  {/* Option: Add another account */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.accountItem,
                      pressed && { backgroundColor: "#F1F3F4" },
                    ]}
                    onPress={() => handleGoogleSelect("Google User", "user@gmail.com")}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: "#F1F3F4" }]}>
                      <User size={18} color="#5F6368" />
                    </View>
                    <View style={styles.accountDetails}>
                      <Text style={[styles.accountName, { color: "#1A73E8" }]}>Use another account</Text>
                    </View>
                  </Pressable>
                </View>

                {/* Terms Disclaimer */}
                <Text style={styles.modalDisclaimer}>
                  To continue, Google will share your name, email address, language preference, and profile picture with Random Quotes. See our Privacy Policy and Terms of Service.
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Username Prompt Modal after Google Sign-up */}
      <Modal
        visible={showNamePrompt}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, !isMobile && styles.webModalContent]}>
            <Text style={styles.modalTitle}>Set Your Name</Text>
            <Text style={styles.modalSubtitle}>Please enter the name you would like to display in your profile.</Text>

            <View style={[styles.inputContainer, { backgroundColor: "#F1F3F4", borderColor: "#DADCE0", marginTop: 16 }]}>
              <View style={styles.inputIcon}>
                <User size={18} color="#5F6368" />
              </View>
              <TextInput
                style={[styles.input, { color: "#202124" }]}
                placeholder="Display Name"
                placeholderTextColor="#5F6368"
                value={promptName}
                onChangeText={setPromptName}
                autoFocus
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                { marginTop: 24, borderRadius: 8, overflow: "hidden", opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleSavePromptName}
            >
              <LinearGradient
                colors={["#E8B76E", "#C8873A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnGradient}
              >
                <Text style={styles.submitBtnText}>Save & Continue</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// Inline dynamic helper to fix styling issue
const toggleTextStyles = (colors: any) => ({
  color: "#A89880",
  fontSize: 13,
  fontWeight: "500" as const,
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  lightBeam: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(232, 183, 110, 0.15)",
    transform: [{ scaleX: 1.5 }, { rotate: "-45deg" }],
    pointerEvents: "none",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    width: "100%",
  },
  webScrollContent: {
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(37, 32, 28, 0.75)",
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      default: {
        shadowColor: "rgba(0, 0, 0, 0.5)",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
    }),
  },
  webCard: {
    marginVertical: 40,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  quoteIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(212, 160, 84, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 160, 84, 0.2)",
  },
  logoTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#E8D5B0",
    letterSpacing: -0.5,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  logoSubtitle: {
    fontSize: 13,
    color: "#A89880",
    marginTop: 4,
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#D4A054",
    marginBottom: 4,
  },
  errorText: {
    color: "#E07070",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 22, 20, 0.6)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3D3224",
    height: 52,
    width: "100%",
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 10,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: "#F0E6D8",
    fontSize: 15,
    paddingRight: 16,
  },
  eyeIcon: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 24,
    gap: 12,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    overflow: "hidden",
  },
  btnGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: "#1E1611",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  toggleBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(168, 152, 128, 0.15)",
  },
  dividerText: {
    color: "#6D5E50",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 12,
  },
  googleBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8D5B0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  googleText: {
    color: "#3C4043",
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Google Chooser Modal Styles ──────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    width: "100%",
    maxWidth: 380,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  webModalContent: {
    // Handled by maxWidth on modalContent directly
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  googleHeaderLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  googleBrandText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202124",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "500",
    color: "#202124",
    textAlign: "left",
  },
  modalSubtitle: {
    fontSize: 15,
    color: "#5F6368",
    marginTop: 4,
    marginBottom: 20,
    textAlign: "left",
  },
  accountList: {
    gap: 2,
    width: "100%",
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 12,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: "600",
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3C4043",
  },
  accountEmail: {
    fontSize: 12,
    color: "#5F6368",
    marginTop: 1,
  },
  modalDisclaimer: {
    fontSize: 12,
    color: "#5F6368",
    lineHeight: 18,
    marginTop: 24,
    textAlign: "left",
  },
  googleLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 16,
  },
  googleLoadingText: {
    fontSize: 14,
    color: "#5F6368",
    fontWeight: "500",
  },
  mobileCard: {
    padding: 20,
    borderRadius: 20,
  },
  mobileLogoSection: {
    marginBottom: 16,
  },
  mobileQuoteIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  mobileLogoTitle: {
    fontSize: 20,
  },
  mobileInputContainer: {
    height: 48,
  },
  mobileSubmitBtn: {
    height: 48,
  },
  mobileGoogleBtn: {
    height: 46,
  },
});
