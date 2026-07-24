import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import CustomHeader from '../components/common/CustomHeader';
import SuccessOverlay from '../components/common/SuccessOverlay';
import LoginPromptModal from '../components/common/LoginPromptModal';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import { createCustomOrder } from '../services/Api';

const MAROON = '#5D0829';
const CREAM = '#FCE2BF';
const TAN = '#C09E83';
const IVORY = '#F9F2E7';
const MUTED = '#A47C8C';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// ---- Custom in-app brand calendar (no native picker) ----
const BrandDatePicker = ({
  visible,
  initialDate,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  initialDate: Date | null;
  onCancel: () => void;
  onConfirm: (d: Date) => void;
}) => {
  const today = new Date();
  const start = initialDate || today;
  const [viewY, setViewY] = useState(start.getFullYear());
  const [viewM, setViewM] = useState(start.getMonth());
  const [sel, setSel] = useState<Date | null>(initialDate);

  const firstDow = new Date(viewY, viewM, 1).getDay();
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (viewM === 0) { setViewM(11); setViewY(viewY - 1); } else setViewM(viewM - 1);
  };
  const nextMonth = () => {
    if (viewM === 11) { setViewM(0); setViewY(viewY + 1); } else setViewM(viewM + 1);
  };

  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isPast = (d: number) => new Date(viewY, viewM, d) < midnight(today);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={dp.scrim}>
        <View style={dp.sheet}>
          <View style={dp.header}>
            <Text style={dp.headerKicker}>DELIVERY DATE</Text>
            <Text style={dp.headerDate}>
              {sel ? `${DOW_FULL(sel)}, ${sel.getDate()} ${MONTHS[sel.getMonth()].slice(0, 3)}` : 'Select a date'}
            </Text>
          </View>

          <View style={dp.nav}>
            <TouchableOpacity style={dp.navBtn} onPress={prevMonth}><Text style={dp.navTxt}>‹</Text></TouchableOpacity>
            <Text style={dp.month}>{MONTHS[viewM]} {viewY}</Text>
            <TouchableOpacity style={dp.navBtn} onPress={nextMonth}><Text style={dp.navTxt}>›</Text></TouchableOpacity>
          </View>

          <View style={dp.dowRow}>
            {DOW.map((d, i) => <Text key={i} style={dp.dow}>{d}</Text>)}
          </View>

          <View style={dp.grid}>
            {cells.map((d, i) => {
              if (d === null) return <View key={i} style={dp.cell} />;
              const thisDate = new Date(viewY, viewM, d);
              const selected = sel && sameDay(thisDate, sel);
              const past = isPast(d);
              return (
                <TouchableOpacity
                  key={i}
                  style={[dp.cell, selected && dp.cellSel]}
                  disabled={past}
                  onPress={() => setSel(thisDate)}
                  activeOpacity={0.7}
                >
                  <Text style={[dp.cellTxt, past && dp.cellPast, selected && dp.cellSelTxt]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={dp.btns}>
            <TouchableOpacity style={[dp.btn, dp.cancel]} onPress={onCancel}>
              <Text style={dp.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dp.btn, dp.ok, !sel && { opacity: 0.5 }]}
              disabled={!sel}
              onPress={() => sel && onConfirm(sel)}
            >
              <Text style={dp.okTxt}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
const DOW_FULL = (d: Date) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const CustomOrder = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { showLoginPrompt, checkAndPromptLogin, closeLoginPrompt } = useLoginPrompt();

  const [images, setImages] = useState<any[]>([]);
  const [weight, setWeight] = useState('');
  const [purity, setPurity] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
  const [remark, setRemark] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  React.useEffect(() => {
    if (isFocused) checkAndPromptLogin();
  }, [isFocused]);

  const addImages = (assets: any[]) => {
    const mapped = assets
      .filter(a => a && a.uri)
      .map(a => ({ uri: a.uri, name: a.fileName || `custom_${Date.now()}.jpg`, type: a.type || 'image/jpeg' }));
    setImages(prev => [...prev, ...mapped].slice(0, 6));
  };

  const pickImages = () => {
    Alert.alert('Add design photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const res: any = await launchCamera({ mediaType: 'photo', quality: 0.85 });
          if (res?.assets) addImages(res.assets);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const res: any = await launchImageLibrary({ mediaType: 'photo', quality: 0.85, selectionLimit: 6 });
          if (res?.assets) addImages(res.assets);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (images.length === 0) {
      Alert.alert('Add a photo', 'Please add at least one design photo.');
      return;
    }
    if (!weight.trim()) {
      Alert.alert('Weight required', 'Please enter the desired weight.');
      return;
    }
    if (!deliveryDate) {
      Alert.alert('Delivery date', 'Please choose a delivery date.');
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) {
        checkAndPromptLogin();
        return;
      }

      const form = new FormData();
      form.append('user_id', String(userId));
      form.append('weight', weight.trim());
      if (purity.trim()) form.append('purity', purity.trim());
      form.append('quantity', String(quantity));
      form.append('delivery_date', toISO(deliveryDate));
      if (remark.trim()) form.append('remark', remark.trim());
      images.forEach((img) => form.append('images', img as any));

      const res = await createCustomOrder(form, token);

      // reset + show the in-screen success animation
      setImages([]); setWeight(''); setPurity(''); setQuantity(1); setDeliveryDate(null); setRemark('');
      setShowSuccess(true);
      return res;
    } catch (err: any) {
      if (err?.code === 'BUSINESS_NOT_APPROVED') {
        Alert.alert(
          'Account Pending Approval',
          err.error || "Your business account is pending approval. You'll be able to place custom orders once an admin approves your account.",
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('Could not submit', err?.error || err?.message || 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.container}>
      <CustomHeader title="Custom Order" showBack={false} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.lead}>Can't find it in the catalogue? Add photo(s) of the design you want and we'll craft it for you.</Text>

        {/* Photos */}
        <Text style={s.label}>Design photos <Text style={s.req}>*</Text></Text>
        <View style={s.imgGrid}>
          {images.map((img, i) => (
            <View key={i} style={s.thumbWrap}>
              <Image source={{ uri: img.uri }} style={s.thumb} resizeMode="cover" />
              <TouchableOpacity style={s.thumbX} onPress={() => removeImage(i)}>
                <Text style={s.thumbXTxt}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 6 && (
            <TouchableOpacity style={s.addTile} onPress={pickImages} activeOpacity={0.8}>
              <Text style={s.addPlus}>＋</Text>
              <Text style={s.addTxt}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={s.hint}>Up to 6 photos · camera or gallery</Text>

        {/* Weight + Purity */}
        <View style={s.row}>
          <View style={s.col}>
            <Text style={s.label}>Weight <Text style={s.req}>*</Text></Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.inputFlex}
                placeholder="0.000"
                placeholderTextColor={MUTED}
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
              <Text style={s.suffix}>grams</Text>
            </View>
          </View>
          <View style={s.col}>
            <Text style={s.label}>Purity <Text style={s.opt}>(optional)</Text></Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 22K"
              placeholderTextColor={MUTED}
              value={purity}
              onChangeText={setPurity}
            />
          </View>
        </View>

        {/* Quantity + Delivery date */}
        <View style={s.row}>
          <View style={s.col}>
            <Text style={s.label}>Quantity</Text>
            <View style={s.stepper}>
              <TouchableOpacity style={s.stepBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                <Text style={s.stepTxt}>–</Text>
              </TouchableOpacity>
              <Text style={s.qty}>{quantity}</Text>
              <TouchableOpacity style={s.stepBtn} onPress={() => setQuantity(q => q + 1)}>
                <Text style={s.stepTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.col}>
            <Text style={s.label}>Delivery date <Text style={s.req}>*</Text></Text>
            <TouchableOpacity style={s.input} onPress={() => setPickerVisible(true)} activeOpacity={0.8}>
              <Text style={[s.dateTxt, !deliveryDate && { color: MUTED }]}>
                {deliveryDate ? fmtDate(deliveryDate) : 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Remark */}
        <Text style={s.label}>Remark <Text style={s.opt}>(optional)</Text></Text>
        <TextInput
          style={[s.input, s.area]}
          placeholder="Any special instruction…"
          placeholderTextColor={MUTED}
          value={remark}
          onChangeText={setRemark}
          multiline
        />

        <TouchableOpacity
          style={[s.submit, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          <Text style={s.submitTxt}>{submitting ? 'Submitting…' : 'Submit Custom Order'}</Text>
        </TouchableOpacity>

        <View style={s.note}>
          <Text style={s.noteBadge}>PENDING</Text>
          <Text style={s.noteTxt}>After you submit, our team reviews your design and follows up. It appears in My Orders tagged B2B Custom.</Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <BrandDatePicker
        visible={pickerVisible}
        initialDate={deliveryDate}
        onCancel={() => setPickerVisible(false)}
        onConfirm={(d) => { setDeliveryDate(d); setPickerVisible(false); }}
      />

      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={closeLoginPrompt}
        title="Login Required"
        message="Please login to place a custom order"
      />

      <SuccessOverlay
        visible={showSuccess}
        message={'Custom Order\nPlaced'}
        onDone={() => {
          setShowSuccess(false);
          navigation.navigate('Orders');
        }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 30 },
  lead: { fontSize: 12.5, color: '#7a6a70', lineHeight: 19, marginBottom: 14, fontFamily: 'GlorifyDEMO' },
  label: { fontSize: 13, color: '#2a1a20', fontWeight: '700', marginBottom: 6, fontFamily: 'GlorifyDEMO' },
  req: { color: '#b3261e' },
  opt: { color: '#7a6a70', fontWeight: '400', fontSize: 11 },
  imgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  thumbWrap: { width: 74, height: 74, borderRadius: 12, position: 'relative' },
  thumb: { width: 74, height: 74, borderRadius: 12, borderWidth: 1, borderColor: TAN },
  thumbX: { position: 'absolute', top: -7, right: -7, width: 20, height: 20, borderRadius: 10, backgroundColor: MAROON, alignItems: 'center', justifyContent: 'center' },
  thumbXTxt: { color: '#fff', fontSize: 13, lineHeight: 15 },
  addTile: { width: 74, height: 74, borderRadius: 12, borderWidth: 2, borderColor: TAN, borderStyle: 'dashed', backgroundColor: IVORY, alignItems: 'center', justifyContent: 'center' },
  addPlus: { fontSize: 24, color: MAROON, lineHeight: 26 },
  addTxt: { fontSize: 10, color: MAROON, fontWeight: '700' },
  hint: { fontSize: 11, color: '#7a6a70', marginTop: 8, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1, marginBottom: 13 },
  input: { borderWidth: 1.5, borderColor: TAN, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: MAROON, backgroundColor: IVORY, fontFamily: 'GlorifyDEMO' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: TAN, borderRadius: 12, paddingHorizontal: 13, backgroundColor: IVORY },
  inputFlex: { flex: 1, paddingVertical: 11, fontSize: 13, color: MAROON, fontFamily: 'GlorifyDEMO' },
  suffix: { color: '#7a6a70', fontSize: 12, fontWeight: '700' },
  area: { minHeight: 58, textAlignVertical: 'top' },
  dateTxt: { fontSize: 13, color: MAROON, fontFamily: 'GlorifyDEMO' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: TAN, borderRadius: 12, backgroundColor: IVORY, paddingHorizontal: 8, paddingVertical: 6 },
  stepBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: 18, color: MAROON, fontWeight: '700', lineHeight: 20 },
  qty: { fontSize: 15, color: MAROON, fontWeight: '700', fontFamily: 'GlorifyDEMO' },
  submit: { backgroundColor: MAROON, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  submitTxt: { color: CREAM, fontSize: 16, fontWeight: '700', fontFamily: 'GlorifyDEMO', letterSpacing: 0.5 },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#FFF7EA', borderWidth: 1, borderColor: '#EFCF8F', borderRadius: 12, padding: 11, marginTop: 14 },
  noteBadge: { backgroundColor: '#FFF3E0', color: '#B07D0A', fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, overflow: 'hidden' },
  noteTxt: { flex: 1, fontSize: 11.5, color: '#8A6D1F', lineHeight: 17 },
});

const dp = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(30,12,20,0.5)', justifyContent: 'center', paddingHorizontal: 22 },
  sheet: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  header: { backgroundColor: MAROON, paddingHorizontal: 18, paddingVertical: 16 },
  headerKicker: { color: CREAM, fontSize: 10, letterSpacing: 1, opacity: 0.8 },
  headerDate: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 3, fontFamily: 'GlorifyDEMO' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  navBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: IVORY, borderWidth: 1, borderColor: '#ECE2D5', alignItems: 'center', justifyContent: 'center' },
  navTxt: { fontSize: 18, color: MAROON, fontWeight: '700', lineHeight: 20 },
  month: { fontSize: 14, color: '#2a1a20', fontWeight: '800', fontFamily: 'GlorifyDEMO' },
  dowRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 4 },
  dow: { flex: 1, textAlign: 'center', fontSize: 11, color: '#7a6a70', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 8 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellTxt: { fontSize: 13, color: '#2a1a20' },
  cellPast: { color: '#c9bcb0' },
  cellSel: { backgroundColor: MAROON, borderRadius: 10 },
  cellSelTxt: { color: '#fff', fontWeight: '800' },
  btns: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancel: { backgroundColor: IVORY, borderWidth: 1, borderColor: TAN },
  cancelTxt: { color: MAROON, fontSize: 14, fontWeight: '700', fontFamily: 'GlorifyDEMO' },
  ok: { backgroundColor: MAROON },
  okTxt: { color: CREAM, fontSize: 14, fontWeight: '700', fontFamily: 'GlorifyDEMO' },
});

export default CustomOrder;
