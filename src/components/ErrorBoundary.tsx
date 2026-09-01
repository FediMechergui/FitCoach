import React from 'react';
import { Pressable, ScrollView, Text as RNText, View } from 'react-native';
import { darkColors, lume, radius, spacing } from '@/theme';

/**
 * Render-crash fallback — the last net under the whole tree.
 *
 * A class component on purpose (error boundaries must be), themed with the
 * Night Sea tokens directly because the ThemeProvider may itself be below the
 * crash. 3.0.4: calm copy, the stack folded behind Details, selectable text,
 * and Try again keeps its honest meaning — a re-render, not a reboot.
 */
interface State {
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, showDetails: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('FitCoach crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const error = this.state.error;

    return (
      <View style={{ flex: 1, backgroundColor: darkColors.bg, padding: spacing.xl, justifyContent: 'center' }}>
        <ScrollView contentContainerStyle={{ gap: spacing.md }}>
          <RNText style={{ color: darkColors.text, fontSize: 22, fontWeight: '700' }}>
            Something went wrong
          </RNText>
          <RNText style={{ color: darkColors.textMuted, fontSize: 15, lineHeight: 22 }}>
            FitCoach hit an error while drawing this screen. Your data is untouched — this is a
            display problem, not a data problem.
          </RNText>

          <View
            style={{
              backgroundColor: darkColors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: darkColors.border,
              gap: 8,
            }}
          >
            <RNText selectable style={{ color: darkColors.warning, fontSize: 13, fontWeight: '600' }}>
              {error.name}: {error.message}
            </RNText>
            {this.state.showDetails ? (
              <RNText selectable style={{ color: darkColors.textMuted, fontSize: 11, lineHeight: 16 }}>
                {(error.stack ?? '').split('\n').slice(0, 12).join('\n')}
              </RNText>
            ) : null}
            <Pressable onPress={() => this.setState((s) => ({ showDetails: !s.showDetails }))}>
              <RNText style={{ color: lume.base, fontSize: 13, fontWeight: '600' }}>
                {this.state.showDetails ? 'Hide details' : 'Details'}
              </RNText>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => this.setState({ error: null, showDetails: false })}
            style={({ pressed }) => ({
              backgroundColor: pressed ? lume.deep : lume.base,
              borderRadius: radius.sm,
              paddingVertical: 14,
              alignItems: 'center',
            })}
          >
            <RNText style={{ color: lume.ink, fontSize: 15, fontWeight: '600' }}>Try again</RNText>
          </Pressable>
          <RNText style={{ color: darkColors.textFaint, fontSize: 12, textAlign: 'center' }}>
            If it keeps happening, close and reopen the app — and please share the details above.
          </RNText>
        </ScrollView>
      </View>
    );
  }
}
