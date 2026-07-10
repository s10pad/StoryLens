import './i18n';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<'brief' | 'generating' | 'theater'>('brief');
  const [prompt, setPrompt] = useState('');
  const [format, setFormat] = useState<'video' | 'graphic'>('video');
  const [genre, setGenre] = useState('Live Action');
  const [tone, setTone] = useState('Epic');
  const [logs, setLogs] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const GENRES = ["Live Action", "Animation", "Anime", "Sci-Fi", "Horror", "Thriller", "Fantasy", "Mystery", "Action", "Cyberpunk", "Steampunk"];
  const TONES = ["Epic", "Dark", "Whimsical", "Dramatic", "Suspenseful", "Romantic", "Comedic"];
  
  // New formats are visually available but disabled to show they are coming soon, or just unselectable if they are unimplemented on the backend.
  // We'll let the user select them but they'll just fall back to video if the backend doesn't support them yet.

  const API = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

  const toggleLanguage = () => {
    if (i18n.language === 'en') i18n.changeLanguage('fr');
    else if (i18n.language === 'fr') i18n.changeLanguage('pcm');
    else i18n.changeLanguage('en');
  };

  const getLanguageFlag = () => {
    if (i18n.language === 'fr') return '🇫🇷';
    if (i18n.language === 'pcm') return '🇨🇲';
    return '🇬🇧';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStep('generating');
    setLogs([t('startingPipeline')]);
    
    try {
      setLogs(prev => [...prev, t('generatingDirections')]);
      const dRes = await fetch(`${API}/api/directions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, genre, tone })
      });
      const dData = await dRes.json();
      const pickedDir = dData.directions?.[0];
      const pickedStyle = dData.styles?.[0];

      // Added analyzing text to keep the user engaged
      setLogs(prev => [...prev, t('analyzing')]);
      setLogs(prev => [...prev, t('generatingTrailer')]);
      
      const tRes = await fetch(`${API}/api/generate-trailer`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, genre, tone, direction: pickedDir, style: pickedStyle, format })
      });
      const tData = await tRes.json();

      setLogs(prev => [...prev, t('trailerReady')]);
      setVideoUrl(`${API}${tData.trailerUrl}`);
      setStep('theater');
    } catch (e: any) {
      setLogs(prev => [...prev, `${t('error')}: ${e.message}`]);
    }
  };

  const reset = () => {
    setPrompt('');
    setLogs([]);
    setVideoUrl(null);
    setStep('brief');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.logo}>Story<Text style={styles.logoAccent}>Lens</Text></Text>
          <Text style={styles.badge}>MOBILE</Text>
        </View>
        <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
          <Text style={styles.langToggleText}>{getLanguageFlag()}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* STEP: BRIEF */}
        {step === 'brief' && (
          <View style={styles.panel}>
            <Text style={styles.eyebrow}>{t('step01')}</Text>
            <Text style={styles.title}>{t('whatsYourStory')}</Text>
            
            <Text style={styles.label}>{t('storyPremise')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('premisePlaceholder')}
              placeholderTextColor="#555"
              multiline
              numberOfLines={4}
              value={prompt}
              onChangeText={setPrompt}
            />

            <Text style={styles.label}>{t('format')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
              {['video', 'graphic', 'audiobook', 'textAdventure', 'storyboard'].map(f => (
                <TouchableOpacity 
                  key={f} 
                  style={[styles.chip, format === f && styles.chipActive]}
                  onPress={() => setFormat(f as any)}
                >
                  <Text style={[styles.chipText, format === f && styles.chipTextActive]}>
                    {f === 'video' ? t('videoTrailer') : 
                     f === 'graphic' ? t('graphicComic') : 
                     f === 'audiobook' ? t('audiobook') :
                     f === 'textAdventure' ? t('textAdventure') :
                     t('storyboard')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>{t('tone')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
              {TONES.map(tOption => (
                <TouchableOpacity 
                  key={tOption} 
                  style={[styles.chip, tone === tOption && styles.chipActive]}
                  onPress={() => setTone(tOption)}
                >
                  <Text style={[styles.chipText, tone === tOption && styles.chipTextActive]}>{tOption}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>{t('genre')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }}>
              {GENRES.map(g => (
                <TouchableOpacity 
                  key={g} 
                  style={[styles.chip, genre === g && styles.chipActive]}
                  onPress={() => setGenre(g)}
                >
                  <Text style={[styles.chipText, genre === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.buttonPrimary, !prompt.trim() && { opacity: 0.5 }]} 
              onPress={handleGenerate}
              disabled={!prompt.trim()}
            >
              <Text style={styles.buttonPrimaryText}>{t('generateTrailer')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP: GENERATING */}
        {step === 'generating' && (
          <View style={styles.panel}>
            <Text style={styles.eyebrow}>{t('step02')}</Text>
            <Text style={styles.title}>{t('studioPipeline')}</Text>
            
            <View style={styles.terminal}>
              <ActivityIndicator size="small" color="#e8c547" style={{ alignSelf: 'flex-start', marginBottom: 16 }} />
              {logs.map((log, i) => (
                <Text key={i} style={styles.terminalText}>✓ {log}</Text>
              ))}
            </View>
          </View>
        )}

        {/* STEP: THEATER */}
        {step === 'theater' && (
          <View style={styles.panel}>
            <Text style={styles.eyebrow}>{t('step03')}</Text>
            <Text style={styles.title}>{t('yourTrailer')}</Text>
            
            <View style={styles.videoPlaceholder}>
              <Text style={styles.terminalText}>{t('videoPlayerOutput')}</Text>
              <Text style={styles.dimText}>{videoUrl}</Text>
            </View>

            <TouchableOpacity style={styles.buttonSecondary} onPress={reset}>
              <Text style={styles.buttonSecondaryText}>{t('startNewTrailer')}</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06060a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a28',
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    fontFamily: 'serif',
  },
  logoAccent: {
    color: '#e8c547',
  },
  badge: {
    fontSize: 10,
    backgroundColor: 'rgba(232, 197, 71, 0.1)',
    color: '#e8c547',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  langToggle: {
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  langToggleText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  panel: {
    width: '100%',
  },
  eyebrow: {
    fontSize: 10,
    color: '#e8c547',
    letterSpacing: 2,
    marginBottom: 8,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 32,
    fontFamily: 'serif',
  },
  label: {
    fontSize: 11,
    color: '#666',
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#0a0a14',
    borderWidth: 1,
    borderColor: '#1a1a28',
    borderRadius: 8,
    padding: 16,
    color: '#ddd',
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  chip: {
    backgroundColor: '#0a0a14',
    borderWidth: 1,
    borderColor: '#1a1a28',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  chipActive: {
    borderColor: '#e8c547',
    backgroundColor: '#11111a',
  },
  chipText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#e8c547',
  },
  buttonPrimary: {
    backgroundColor: '#e8c547',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonPrimaryText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonSecondaryText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '700',
  },
  terminal: {
    backgroundColor: '#040408',
    borderWidth: 1,
    borderColor: '#0f0f18',
    borderRadius: 8,
    padding: 20,
    minHeight: 200,
  },
  terminalText: {
    color: '#2ecc71',
    fontFamily: 'monospace',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 20,
  },
  videoPlaceholder: {
    aspectRatio: 16/9,
    backgroundColor: '#040408',
    borderWidth: 1,
    borderColor: '#1a1a28',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dimText: {
    color: '#444',
    fontSize: 11,
    marginTop: 8,
  }
});
