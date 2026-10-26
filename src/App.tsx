import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { OrderDraft, OrderItem, Product } from './types/pharmacy';
import { RAW_PRODUCTS } from './data/products';
import { REPRESENTER } from './data/constants';
import { calculateBonusUnits, calculateOrderSummary } from './utils/orderCalculations';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/firebaseAuth';
import { createOrderSpreadsheet } from './services/googleSheetsService';
import {
  testConnection,
  saveDraftToFirestore,
  fetchUserDraftsFromFirestore,
  deleteDraftFromFirestore,
  saveUserProfile,
} from './services/firebaseFirestore';

import { Header, AppTab } from './components/Header';
import { CatalogSection } from './components/CatalogSection';
import { OrderDraftSection } from './components/OrderDraftSection';
import { SavedDraftsModal } from './components/SavedDraftsModal';
import { GoogleDriveSheetsView } from './components/GoogleDriveSheetsView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CustomItemModal } from './components/CustomItemModal';
import { PrintInvoice } from './components/PrintInvoice';
import { BioscienceExplorer } from './components/BioscienceExplorer';
import { GeminiChatbot } from './components/GeminiChatbot';
import { GroundedSearchSection } from './components/GroundedSearchSection';
import { LiveVoiceAssistant } from './components/LiveVoiceAssistant';

import { MessageSquareShare, Cloud, RefreshCw, Mic, Sparkles, X } from 'lucide-react';

const STORAGE_KEY_DRAFTS = 'alfawaz_pharmacy_drafts_v3';
const STORAGE_KEY_CURRENT = 'alfawaz_current_draft_id_v3';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(true);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);

  // App Tabs
  const [activeTab, setActiveTab] = useState<AppTab>('catalog');

  // Modals state
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Google Sheets Export State
  const [isExportingToSheets, setIsExportingToSheets] = useState(false);
  const [sheetsExportSuccessUrl, setSheetsExportSuccessUrl] = useState<string | undefined>();

  // Initialize draft helper
  const createFreshDraft = (pharmacyName = ''): OrderDraft => ({
    id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: 'مسودة طلبية جديدة',
    pharmacyName: pharmacyName || 'صيدلية النور',
    pharmacistName: '',
    phone: '',
    address: '',
    notes: '',
    items: [],
    discountPercent: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
  });

  const [drafts, setDrafts] = useState<OrderDraft[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAFTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }

    // Seed 3 realistic historical drafts for rich dashboard & testing
    const d1 = createFreshDraft('صيدلية السلام النموذجية');
    d1.pharmacistName = 'د. عبد الرحمن';
    d1.phone = '0944123456';
    d1.address = 'دمشق - الميدان';
    d1.createdAt = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    d1.items = [
      {
        id: 'init-1',
        productId: 1,
        name: 'اكزانتريك 40 ملغ 20 حبة',
        company: 'بركات',
        bonus: '3+10',
        unitPrice: 8200,
        quantity: 20,
        freeBonusUnits: 6,
        activeIngredient: 'رابيبرازول',
      },
      {
        id: 'init-2',
        productId: 3,
        name: 'اموكسيبين 500 ملغ 20 حبة',
        company: 'بركات',
        bonus: '2+10',
        unitPrice: 16400,
        quantity: 10,
        freeBonusUnits: 2,
        activeIngredient: 'أموكسيسيلين + كلافولانات',
      },
    ];

    const d2 = createFreshDraft('صيدلية النور الحديثة');
    d2.pharmacistName = 'د. فاطمة الصالح';
    d2.phone = '0955678901';
    d2.address = 'دمشق - الشعلان';
    d2.createdAt = new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString();
    d2.items = [
      {
        id: 'init-3',
        productId: 10,
        name: 'ايبوفين 400 ملغ 30 حبة',
        company: 'بركات',
        bonus: '3+10',
        unitPrice: 7900,
        quantity: 30,
        freeBonusUnits: 9,
        activeIngredient: 'إيبوبروفين',
      },
      {
        id: 'init-4',
        productId: 110,
        name: 'ادبالين جل',
        company: 'دومنا',
        bonus: '2+10',
        unitPrice: 13800,
        quantity: 10,
        freeBonusUnits: 2,
        activeIngredient: 'أداباليني',
      },
      {
        id: 'init-5',
        productId: 187,
        name: 'غلوكوزامين بلس حب',
        company: 'افاميا',
        bonus: '1+10',
        unitPrice: 28000,
        quantity: 10,
        freeBonusUnits: 1,
        activeIngredient: 'غلوكوزامين',
      },
    ];

    const d3 = createFreshDraft('صيدلية الشفاء والعافية');
    d3.pharmacistName = 'د. يوسف الأحمد';
    d3.phone = '0933987654';
    d3.address = 'ريف دمشق - جرمانا';
    d3.createdAt = new Date().toISOString();
    d3.items = [
      {
        id: 'init-6',
        productId: 73,
        name: 'فيتابار سكري 30حبة',
        company: 'بركات',
        bonus: '13+10',
        unitPrice: 40000,
        quantity: 10,
        freeBonusUnits: 13,
        activeIngredient: 'فيتامينات ومكملات',
      },
      {
        id: 'init-7',
        productId: 82,
        name: 'كلافينين 625 ملغ حب',
        company: 'بركات',
        bonus: '8+10',
        unitPrice: 27800,
        quantity: 20,
        freeBonusUnits: 16,
        activeIngredient: 'أموكسيسيلين+كلافولانات',
      },
    ];

    return [d1, d2, d3];
  });

  const [currentDraftId, setCurrentDraftId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (savedId && drafts.some((d) => d.id === savedId)) return savedId;
    } catch (e) {}
    return drafts[0]?.id || '';
  });

  // Current active draft
  const currentDraft = drafts.find((d) => d.id === currentDraftId) || drafts[0];

  // Save drafts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
      localStorage.setItem(STORAGE_KEY_CURRENT, currentDraftId);
    } catch (e) {
      console.error(e);
    }
  }, [drafts, currentDraftId]);

  // Test Firestore Connection on boot
  useEffect(() => {
    testConnection().then((connected) => {
      setIsFirestoreConnected(connected);
    });
  }, []);

  // Initialize Firebase Auth & Sync User Profile
  useEffect(() => {
    const unsubscribe = initAuth(
      async (authenticatedUser) => {
        setUser(authenticatedUser);
        setNeedsAuth(false);
        try {
          await saveUserProfile({
            uid: authenticatedUser.uid,
            email: authenticatedUser.email,
            displayName: authenticatedUser.displayName,
          });
          // Attempt to load cloud drafts
          const cloudDrafts = await fetchUserDraftsFromFirestore(authenticatedUser.uid);
          if (cloudDrafts && cloudDrafts.length > 0) {
            setDrafts((prev) => {
              const merged = [...cloudDrafts];
              prev.forEach((p) => {
                if (!merged.some((m) => m.id === p.id)) {
                  merged.push(p);
                }
              });
              return merged;
            });
          }
        } catch (e) {
          console.error('Error syncing user profile with Firestore:', e);
        }
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Google Sign-In Handler
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setNeedsAuth(false);
        showToast(`✅ تم تسجيل الدخول بنجاح وتفعيل مزامنة Firestore: ${res.user.email}`);

        // Save profile
        await saveUserProfile({
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
        });

        // Sync current draft
        if (currentDraft) {
          await saveDraftToFirestore(currentDraft, res.user.uid);
        }
      }
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      showToast('⚠️ تعذر تسجيل الدخول بحساب Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    showToast('تم تسجيل الخروج من Google');
  };

  // Sync draft explicitly to Firestore
  const handleSyncToFirestore = async () => {
    if (!user) {
      await handleGoogleLogin();
      return;
    }
    setIsSyncingFirestore(true);
    try {
      await saveDraftToFirestore(currentDraft, user.uid);
      showToast('☁️ تم حفظ ومزامنة المسودة بنجاح في قاعدة بيانات Firestore');
    } catch (err: any) {
      console.error(err);
      showToast('⚠️ تعذر مزامنة المسودة مع Firestore');
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  // Add product to draft
  const handleAddToCart = (product: Product, quantity = 1) => {
    if (!currentDraft) return;

    const existingIndex = currentDraft.items.findIndex(
      (it) => it.productId === product.id || it.name === product.n
    );

    let updatedItems: OrderItem[];

    if (existingIndex >= 0) {
      const existing = currentDraft.items[existingIndex];
      const newQty = existing.quantity + quantity;
      const freeBonus = calculateBonusUnits(existing.bonus, newQty);

      updatedItems = [...currentDraft.items];
      updatedItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        freeBonusUnits: freeBonus,
      };
    } else {
      const freeBonus = calculateBonusUnits(product.b, quantity);
      const newItem: OrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        name: product.n,
        company: product.c,
        bonus: product.b,
        unitPrice: product.p,
        quantity: quantity,
        freeBonusUnits: freeBonus,
        activeIngredient: product.act,
      };
      updatedItems = [...currentDraft.items, newItem];
    }

    const updatedDraft: OrderDraft = {
      ...currentDraft,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    setDrafts((prev) =>
      prev.map((d) => (d.id === currentDraft.id ? updatedDraft : d))
    );

    // Auto-sync to Firestore in background if logged in
    if (user) {
      saveDraftToFirestore(updatedDraft, user.uid).catch((e) =>
        console.error('Auto-sync draft error:', e)
      );
    }

    showToast(`✅ تم إضافة "${product.n}" إلى المسودة`);
  };

  // Update whole draft
  const handleUpdateDraft = (updated: OrderDraft) => {
    setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    if (user) {
      saveDraftToFirestore(updated, user.uid).catch((e) =>
        console.error('Sync draft error:', e)
      );
    }
  };

  // Save as new draft
  const handleSaveNewDraft = () => {
    const newDraft = createFreshDraft(
      currentDraft.pharmacyName ? `${currentDraft.pharmacyName} (جديدة)` : ''
    );
    setDrafts((prev) => [newDraft, ...prev]);
    setCurrentDraftId(newDraft.id);
    setActiveTab('draft');
    if (user) {
      saveDraftToFirestore(newDraft, user.uid).catch((e) =>
        console.error('Save draft error:', e)
      );
    }
    showToast('تم إنشاء مسودة طلبية جديدة فارغة');
  };

  // Clear current draft items
  const handleClearDraft = () => {
    if (confirm('هل أنت متأكد من تفريغ كافة أصناف المسودة الحالية؟')) {
      const cleared: OrderDraft = {
        ...currentDraft,
        items: [],
        discountPercent: 0,
        updatedAt: new Date().toISOString(),
      };
      handleUpdateDraft(cleared);
      showToast('تم تفريغ أصناف المسودة');
    }
  };

  // Add custom manual item
  const handleAddCustomItem = (item: OrderItem) => {
    if (!currentDraft) return;
    const updatedDraft: OrderDraft = {
      ...currentDraft,
      items: [...currentDraft.items, item],
      updatedAt: new Date().toISOString(),
    };
    handleUpdateDraft(updatedDraft);
    showToast(`تمت إضافة صنف مخصص: ${item.name}`);
  };

  // Export current draft to Google Sheets in Drive
  const handleExportToGoogleSheets = async () => {
    if (!user) {
      await handleGoogleLogin();
      return;
    }
    if (currentDraft.items.length === 0) {
      alert('المسودة فارغة! أضف أصنافاً أولاً');
      return;
    }

    setIsExportingToSheets(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('لم يتم العثور على تصريح وصول Google Sheets');
      }

      const result = await createOrderSpreadsheet(currentDraft, token);
      setSheetsExportSuccessUrl(result.spreadsheetUrl);

      // Save sheet url inside draft
      const updatedDraft: OrderDraft = {
        ...currentDraft,
        googleSheetUrl: result.spreadsheetUrl,
        googleSheetId: result.spreadsheetId,
        status: 'synced_sheets',
        updatedAt: new Date().toISOString(),
      };
      handleUpdateDraft(updatedDraft);

      showToast(`🎉 تم حفظ وتصدير جدول الطلبية بنجاح إلى Google Drive!`);
    } catch (err: any) {
      console.error('Failed to export to Google Sheets:', err);
      alert(`تعذر تصدير الجدول إلى Google Sheets: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setIsExportingToSheets(false);
    }
  };

  const draftSummary = calculateOrderSummary(currentDraft.items, currentDraft.discountPercent);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900" dir="rtl">
      {/* Printable Invoice (Invisible on screen, visible during window.print()) */}
      <PrintInvoice draft={currentDraft} />

      {/* Main App Navigation Header */}
      <Header
        user={user}
        needsAuth={needsAuth}
        isLoggingIn={isLoggingIn}
        onLogin={handleGoogleLogin}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={currentDraft.items.length}
        totalUnits={draftSummary.totalPaidUnits}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
        isFirestoreConnected={isFirestoreConnected}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0a3320] text-amber-300 border border-[#c9a227]/60 px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Quick Representative & Cloud Status Card */}
      <div className="no-print bg-gradient-to-r from-[#062014] via-[#0d452d] to-[#062014] text-white py-6 px-4 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-right">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border-2 border-[#c9a227] flex items-center justify-center text-3xl shadow-md">
              👨‍💼
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-amber-300">
                  {REPRESENTER.name}
                </h2>
                <span className="bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  المندوب المعتمد الحصري
                </span>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-400/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  AI & Bioscience Enabled
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {REPRESENTER.role} • مستودع الفواز للأدوية
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                <span className="font-mono text-white font-bold">
                  📞 {REPRESENTER.phone}
                </span>
                <a
                  href={`https://wa.me/963${REPRESENTER.phone.substring(1)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#25d366] hover:bg-[#1ebe57] text-white font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 text-[11px] transition-colors"
                >
                  <MessageSquareShare className="w-3 h-3" />
                  محادثة واتساب
                </a>
              </div>
            </div>
          </div>

          {/* Quick Active Draft Info & Firestore Sync CTA */}
          <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-3 px-4 flex items-center gap-4 text-xs">
            <div>
              <div className="text-slate-400 text-[11px]">المسودة النشطة الحالية:</div>
              <div className="font-bold text-amber-300 text-sm truncate max-w-[180px]">
                {currentDraft.pharmacyName || 'صيدلية'}
              </div>
              <div className="text-emerald-400 font-bold">
                <span>{draftSummary.totalItemsCount} صنف</span> (<span className="font-mono">{draftSummary.totalPaidUnits}</span> علبة)
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setActiveTab('draft')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl transition-all"
              >
                فتح المسودة
              </button>
              {user && (
                <button
                  onClick={handleSyncToFirestore}
                  disabled={isSyncingFirestore}
                  className="bg-teal-600/80 hover:bg-teal-500 text-white font-semibold px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 justify-center transition-all"
                  title="مزامنة مع قاعدة بيانات Firestore"
                >
                  <Cloud className="w-3 h-3" />
                  {isSyncingFirestore ? 'جاري المزامنة...' : 'مزامنة Firestore'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Body View based on Active Tab */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'catalog' && (
          <CatalogSection
            onAddToCart={handleAddToCart}
            onOpenDetail={(product) => setSelectedProductForDetail(product)}
          />
        )}

        {activeTab === 'draft' && (
          <OrderDraftSection
            draft={currentDraft}
            onUpdateDraft={handleUpdateDraft}
            onSaveNewDraft={handleSaveNewDraft}
            onClearDraft={handleClearDraft}
            onOpenCustomItemModal={() => setIsCustomItemModalOpen(true)}
            onExportToGoogleSheets={handleExportToGoogleSheets}
            isExportingToSheets={isExportingToSheets}
            sheetsExportSuccessUrl={sheetsExportSuccessUrl}
            isGoogleAuthenticated={!!user}
            onPromptGoogleLogin={handleGoogleLogin}
          />
        )}

        {activeTab === 'bioscience' && (
          <BioscienceExplorer
            currentItems={currentDraft.items}
            availableProducts={RAW_PRODUCTS}
            onAddProductToDraft={handleAddToCart}
          />
        )}

        {activeTab === 'gemini_chat' && (
          <GeminiChatbot currentDraft={currentDraft} />
        )}

        {activeTab === 'grounded_search' && (
          <GroundedSearchSection currentDraft={currentDraft} />
        )}

        {activeTab === 'dashboard' && (
          <AnalyticsDashboard
            drafts={drafts}
            onOpenDraft={(id) => {
              setCurrentDraftId(id);
              setActiveTab('draft');
            }}
          />
        )}

        {activeTab === 'drafts_list' && (
          <SavedDraftsModal
            drafts={drafts}
            currentDraftId={currentDraftId}
            onSelectDraft={(id) => {
              setCurrentDraftId(id);
              setActiveTab('draft');
            }}
            onDeleteDraft={async (id) => {
              const remaining = drafts.filter((d) => d.id !== id);
              setDrafts(remaining);
              if (currentDraftId === id && remaining.length > 0) {
                setCurrentDraftId(remaining[0].id);
              }
              if (user) {
                try {
                  await deleteDraftFromFirestore(id, user.uid);
                } catch (e) {
                  console.error(e);
                }
              }
              showToast('تم حذف المسودة');
            }}
            onCreateNewDraft={handleSaveNewDraft}
          />
        )}

        {activeTab === 'drive_sheets' && (
          <GoogleDriveSheetsView
            user={user}
            onLogin={handleGoogleLogin}
            currentDraft={currentDraft}
            onExportCurrentDraft={handleExportToGoogleSheets}
            isExporting={isExportingToSheets}
            exportedUrl={sheetsExportSuccessUrl}
          />
        )}
      </main>

      {/* Floating Live Voice Assistant Modal */}
      {isVoiceAssistantOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full relative">
            <LiveVoiceAssistant
              onClose={() => setIsVoiceAssistantOpen(false)}
              orderContext={`الصيدلية: ${currentDraft.pharmacyName}، الأصناف: ${currentDraft.items.length}`}
            />
          </div>
        </div>
      )}

      {/* Floating Live Voice Quick Trigger Widget (when modal is closed) */}
      {!isVoiceAssistantOpen && (
        <button
          onClick={() => setIsVoiceAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center gap-2 group border-2 border-white/40"
          title="افتح المساعد الصوتي الحي (gemini-3.8-live)"
        >
          <Mic className="w-5 h-5 animate-pulse" />
          <span className="hidden group-hover:inline text-xs font-black pr-1 whitespace-nowrap">
            مكالمة صوتية حية (Live)
          </span>
        </button>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onAddToCart={handleAddToCart}
        onInspectBioscience={() => {
          setActiveTab('bioscience');
        }}
      />

      {/* Custom Item Adder Modal */}
      <CustomItemModal
        isOpen={isCustomItemModalOpen}
        onClose={() => setIsCustomItemModalOpen(false)}
        onAddItem={handleAddCustomItem}
      />

      {/* Footer */}
      <footer className="no-print bg-[#062014] text-slate-400 py-6 px-4 border-t border-[#c9a227]/30 text-xs text-center space-y-2 mt-auto">
        <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm">
          <span>💊 مستودع الفواز للأدوية البشرية</span>
          <span>•</span>
          <span>المندوب فواز البشير (0995711536)</span>
        </div>
        <p className="max-w-xl mx-auto text-slate-500 leading-relaxed">
          تطبيق متكامل لإدارة ومزامنة مسودات طلبيات الأدوية مع Google Sheets وFirestore، مزود بمستكشف العلوم الحيوية (PubChem & ChEMBL)، ومساعد صوتي مباشر (Gemini 3.8 Live API)، وبحث موثق (Google Search Grounding).
        </p>
        <p className="text-[11px] text-slate-600">
          جميع الأسعار والبونصات مستخرجة من البروشورات الدوائية المحدثة
        </p>
      </footer>
    </div>
  );
}
