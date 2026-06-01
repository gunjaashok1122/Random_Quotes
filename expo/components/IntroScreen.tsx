import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const videoSource =
  "https://drive.google.com/uc?export=download&id=14zKN7mfXv_wV0XanGs6JSXp7rpq233RQ";

interface IntroScreenProps {
  onFinished: () => void;
}

export default function IntroScreen({ onFinished }: IntroScreenProps) {
  // Auto-advance after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinished();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onFinished]);

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <video
          src={videoSource}
          autoPlay
          muted
          playsInline
          style={styles.webVideo}
          onEnded={onFinished}
          onError={() => onFinished()} // skip on error
        />
        <Pressable style={styles.skipButton} onPress={onFinished}>
          <Text style={styles.skipText}>Skip Intro</Text>
        </Pressable>
      </View>
    );
  }

  // Native iOS / Android
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    const subscription = player.addListener("playToEnd", () => {
      onFinished();
    });
    return () => {
      subscription.remove();
    };
  }, [player, onFinished]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.nativeVideo}
        contentFit="cover"
        allowsFullscreen={false}
        showsPlaybackControls={false}
      />
      <Pressable style={styles.skipButton} onPress={onFinished}>
        <Text style={styles.skipText}>Skip Intro</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1614", // dark theme background matching deepCharcoal
    justifyContent: "center",
    alignItems: "center",
  },
  webVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  nativeVideo: {
    width: "100%",
    height: "100%",
  },
  skipButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 1001,
  },
  skipText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
