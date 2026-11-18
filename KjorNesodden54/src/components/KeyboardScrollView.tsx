import { useCallback, useEffect, useRef, type ComponentRef } from "react";
import { Keyboard, Platform, ScrollView, StyleSheet, TextInput, type ScrollViewProps } from "react-native";

const FIELD_GAP = 16;

/** The root KeyboardAvoidingView resizes the screen; keep its focused field in view. */
export default function KeyboardScrollView({
  style, contentContainerStyle, onScroll, onLayout, onContentSizeChange,
  onFocusCapture, onBlurCapture, ...props
}: ScrollViewProps) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(0);
  const ownsFocus = useRef(false);
  const keyboardTop = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const measurement = useRef(0);

  const cancelPendingMeasurement = useCallback(() => {
    measurement.current++;
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  }, []);

  const keepFocusVisible = useCallback(() => {
    if (Platform.OS === "web") return;
    cancelPendingMeasurement();
    const version = measurement.current;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const scroll = scrollRef.current;
      const input = TextInput.State.currentlyFocusedInput();
      if (!ownsFocus.current || keyboardTop.current === null || !scroll || !input) return;

      // Window coordinates account for custom headers and the tab bar as well as the keyboard.
      scroll.measureInWindow((_x, viewportY, _width, viewportHeight) => {
        input.measureInWindow((_inputX, inputY, _inputWidth, inputHeight) => {
          if (version !== measurement.current || !ownsFocus.current ||
              keyboardTop.current === null || viewportHeight <= 0 || inputHeight <= 0 ||
              TextInput.State.currentlyFocusedInput() !== input) return;

          const top = viewportY + FIELD_GAP;
          const bottom = Math.min(viewportY + viewportHeight, keyboardTop.current) - FIELD_GAP;
          if (bottom <= top) return;
          // For a tall multiline field, reveal its top without scrolling past it.
          const visibleHeight = Math.min(inputHeight, bottom - top);
          const delta = inputY < top ? inputY - top : Math.max(0, inputY + visibleHeight - bottom);
          if (Math.abs(delta) > 1) {
            scroll.scrollTo({ y: Math.max(0, scrollY.current + delta), animated: true });
          }
        });
      });
    });
  }, [cancelPendingMeasurement]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    keyboardTop.current = Keyboard.metrics()?.screenY ?? null;
    const show = Keyboard.addListener("keyboardDidShow", (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      keepFocusVisible();
    });
    const change = Keyboard.addListener("keyboardWillChangeFrame", (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      keepFocusVisible();
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTop.current = null;
      cancelPendingMeasurement();
    });
    return () => {
      show.remove();
      change.remove();
      hide.remove();
      cancelPendingMeasurement();
    };
  }, [cancelPendingMeasurement, keepFocusVisible]);

  return (
    <ScrollView
      {...props}
      ref={scrollRef}
      style={[styles.scroll, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      automaticallyAdjustKeyboardInsets={false}
      scrollEventThrottle={16}
      onFocusCapture={(event) => {
        ownsFocus.current = true;
        keepFocusVisible();
        onFocusCapture?.(event);
      }}
      onBlurCapture={(event) => {
        ownsFocus.current = false;
        cancelPendingMeasurement();
        onBlurCapture?.(event);
      }}
      onLayout={(event) => {
        keepFocusVisible();
        onLayout?.(event);
      }}
      onContentSizeChange={(width, height) => {
        keepFocusVisible();
        onContentSizeChange?.(width, height);
      }}
      onScroll={(event) => {
        scrollY.current = event.nativeEvent.contentOffset.y;
        onScroll?.(event);
      }}
    />
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 24 },
});
