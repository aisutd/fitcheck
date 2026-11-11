import { Tabs, Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { FitCheckProvider } from '../../App';
import { palette } from '../theme/tokens';
const sections = { index: 'Outfits', search: 'Explore', wardrobe: 'Wardrobe', avatar: 'Avatar', quiz: 'Know you' };
function Navigation({ state }) {
 return <SafeAreaView edges={['bottom']} style={styles.area}><View style={styles.nav}>
  {state.routes.filter((route) => sections[route.name]).map((route) => {
   const active = state.routes[state.index].key === route.key;
   return <Link key={route.key} href={route.name === 'index' ? '/' : `/${route.name}`} asChild><Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} style={StyleSheet.flatten([styles.tab, active && styles.active])}><Text style={[styles.label, active && styles.selected]}>{sections[route.name]}</Text></Pressable></Link>;
  })}
 </View></SafeAreaView>;
}
export default function RootLayout() {
 return <SafeAreaProvider><FitCheckProvider><Tabs tabBar={(props) => <Navigation {...props} />} screenOptions={{ headerShown: false }}>
  {Object.entries(sections).map(([name,title]) => <Tabs.Screen key={name} name={name} options={{ title }} />)}
  {['analysis','collections','privacy','shopping','style-tools','try-on'].map((name) => <Tabs.Screen key={name} name={name} options={{ href: null }} />)}
 </Tabs></FitCheckProvider></SafeAreaProvider>;
}
const styles = StyleSheet.create({ area:{backgroundColor:palette.paper,borderTopWidth:1,borderColor:palette.line},nav:{flexDirection:'row',maxWidth:760,width:'100%',alignSelf:'center'},tab:{flex:1,minHeight:58,alignItems:'center',justifyContent:'center',borderTopWidth:2,borderTopColor:'transparent'},active:{borderTopColor:palette.accent,backgroundColor:palette.soft},label:{fontSize:11,fontWeight:'600',color:palette.muted},selected:{color:palette.accent,fontWeight:'800'} });
