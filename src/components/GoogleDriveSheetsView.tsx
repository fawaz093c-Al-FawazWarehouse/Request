import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { OrderDraft } from '../types/pharmacy';
import { listUserOrderSheets } from '../services/googleSheetsService';
import { getAccessToken } from '../services/firebaseAuth';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface GoogleDriveSheetsViewProps {
  user: User | null;
  onLogin: () => void;
  currentDraft: OrderDraft;
  onExportCurrentDraft: () => void;
  isExporting: boolean;
  exportedUrl?: string;
}

export const GoogleDriveSheetsView: React.FC<GoogleDriveSheetsViewProps> = ({
  user,
  onLogin,
  currentDraft,
  onExportCurrentDraft,
  isExporting,
  exportedUrl,
}) => {
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const fetchDriveSheets = async () => {
    if (!user) return;
    setIsLoadingFiles(true);
    try {
      const token = await getAccessToken();
      if (token) {
        const files = await listUserOrderSheets(token);
        setDriveFiles(files);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDriveSheets();
    }
  }, [user]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            التكامل المباشر مع Google Drive و Google Sheets
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تصدير وحفظ مسودات طلبيات الأدوية في جداول بيانات منظمة تلقائياً في حسابك على Google Drive
          </p>
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDriveSheets}
              disabled={isLoadingFiles}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
              title="تحديث قائمة الجداول"
              aria-label="تحديث"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
            </button>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-emerald-700" />
              <span>فتح Google Drive</span>
            </a>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <span>تسجيل الدخول وربط Google Drive</span>
          </button>
        )}
      </div>

      {/* Account Connection Status Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900">
            حالة الاتصال والخدمة
          </h3>
          {user ? (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                متصل بحساب Google
              </div>
              <div className="text-slate-600 truncate">{user.email}</div>
              <div className="text-[11px] text-emerald-700">
                صلاحيات Google Drive و Sheets مفعلة بنجاح.
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                غير متصل بـ Google
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                سجل الدخول بحسابك على Google لتتمكن من إنشاء وحفظ جداول البيانات في Drive بضغطة زر.
              </p>
              <button
                onClick={onLogin}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition-colors"
              >
                ربط حساب Google الآن
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">مميزات التكامل:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>إنشاء جدول تلقائي مرتب باللغة العربية (RTL).</li>
              <li>حفظ الأصناف والكميات وحسابات البونص بدقة.</li>
              <li>سهولة مشاركة رابط الجدول مع المندوب فواز البشير.</li>
              <li>إمكانية الفتح والتعديل من الهاتف والكمبيوتر.</li>
            </ul>
          </div>
        </div>

        {/* Current Draft Export Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 mb-1">
              تصدير المسودة الحالية إلى Google Sheets
            </h3>
            <p className="text-xs text-slate-500">
              المسودة الحالية: <strong className="text-slate-800">{currentDraft.pharmacyName || 'صيدلية'}</strong> ({currentDraft.items.length} صنف)
            </p>
          </div>

          {exportedUrl || currentDraft.googleSheetUrl ? (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-teal-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                تم إنشاء جدول البيانات بنجاح في Google Drive!
              </div>
              <p className="text-slate-600">
                يمكنك الآن فتح الجدول أو إرسال رابطه مباشرة للمندوب عبر واتساب.
              </p>
              <a
                href={exportedUrl || currentDraft.googleSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-sm transition-colors"
              >
                <span>فتح جدول البيانات في Google Sheets</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
              {currentDraft.items.length === 0 ? (
                <p>⚠️ المسودة فارغة حالياً. أضف بعض الأدوية من الكتالوج لتصدير جدول بياناتها.</p>
              ) : (
                <p>
                  اضغط على زر التصدير أدناه لإنشاء ملف Google Spreadsheet جديد في حسابك على Google Drive وتعبئته بكامل أصناف الطلبية.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                if (!user) {
                  onLogin();
                } else {
                  onExportCurrentDraft();
                }
              }}
              disabled={isExporting || currentDraft.items.length === 0}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>
                {isExporting ? 'جاري إنشاء جدول Google Sheets...' : 'تصدير وحفظ الآن في Google Sheets'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* User's Existing Spreadsheets in Google Drive */}
      {user && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              جداول بيانات الطلبيات في Google Drive ({driveFiles.length})
            </h3>
            <button
              onClick={fetchDriveSheets}
              className="text-xs text-emerald-700 hover:underline font-bold"
            >
              تحديث
            </button>
          </div>

          {isLoadingFiles ? (
            <div className="py-8 text-center text-xs text-slate-400">
              جاري فحص ملفات Google Drive...
            </div>
          ) : driveFiles.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              لم يتم العثور على جداول طلبيات سابقة بعد. عند تصدير أي طلبية ستظهر هنا فوراً.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {driveFiles.map((file) => (
                <div
                  key={file.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">{file.name}</div>
                      <div className="text-[11px] text-slate-400">
                        تاريخ التعديل: {new Date(file.modifiedTime).toLocaleDateString('ar-SY')}
                      </div>
                    </div>
                  </div>
                  <a
                    href={file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold px-3 py-1.5 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <span>فتح في Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
