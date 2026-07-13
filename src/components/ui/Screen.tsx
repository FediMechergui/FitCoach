import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  contentStyle?: ViewStyle;
  refreshControl?: React.ReactElement;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top'],
  contentStyle,
  refreshControl,
}: ScreenProps) {
  const theme = useTheme();
  const pad = padded ? theme.spacing.lg : 0;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[
        { padding: pad, paddingBottom: pad + 96, gap: theme.spacing.lg },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, padding: pad, gap: theme.spacing.lg }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {body}
    </SafeAreaView>
  );
}
