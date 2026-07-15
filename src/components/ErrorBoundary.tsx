import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';

/**
 * Catches render-time crashes so the app shows the error instead of a blank
 * white screen. Without this, any uncaught error during render leaves the user
 * staring at nothing with no way to know what happened.
 */
interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Also log so it appears in `adb logcat` / Metro.
    console.error('FitCoach crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: '#0B1220', padding: 24, justifyContent: 'center' }}>
        <ScrollView contentContainerStyle={{ gap: 12 }}>
          <Text style={{ color: '#FF5D5D', fontSize: 22, fontWeight: '800' }}>
            Something went wrong
          </Text>
          <Text style={{ color: '#EAF0F7', fontSize: 15 }}>
            FitCoach hit an error while starting up. This message is here so it isn't just a
            blank screen — please share it if it keeps happening.
          </Text>
          <View style={{ backgroundColor: '#141C2E', borderRadius: 12, padding: 14 }}>
            <Text style={{ color: '#FFB454', fontSize: 13, fontWeight: '700' }}>
              {error.name}: {error.message}
            </Text>
            {error.stack ? (
              <Text style={{ color: '#9AA6B8', fontSize: 11, marginTop: 8 }}>
                {error.stack.split('\n').slice(0, 8).join('\n')}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => this.setState({ error: null })}
            style={{ backgroundColor: '#4F8CFF', borderRadius: 12, padding: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Try again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}
