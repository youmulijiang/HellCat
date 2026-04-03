import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Dropdown, Input, Popconfirm, Empty, message, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  FileTextOutlined,
  ExportOutlined,
  FileMarkdownOutlined,
  Html5Outlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import MDEditor from '@uiw/react-md-editor';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import { db, type Report, type ReportImage } from '@/stores/reportDb';

/**
 * 报告编写模块主布局
 * 左侧报告列表 + 右侧 Markdown 编辑器
 */
export const ReportLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blobUrlsRef = useRef<Map<string, string>>(new Map());
  const editorRef = useRef<HTMLDivElement>(null);

  /** 释放所有 blob URLs */
  const revokeBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();
  }, []);

  /** 从 IndexedDB 加载图片并生成 blob URLs，替换 content 中的占位符 */
  const resolveImageUrls = useCallback(async (reportId: string, rawContent: string) => {
    revokeBlobUrls();
    const images = await db.images.where('reportId').equals(reportId).toArray();
    let resolved = rawContent;
    for (const img of images) {
      const blobUrl = URL.createObjectURL(img.blob);
      blobUrlsRef.current.set(img.id, blobUrl);
      // 替换 indexeddb://imageId 占位符为实际 blob URL
      resolved = resolved.replaceAll(`indexeddb://${img.id}`, blobUrl);
    }
    return resolved;
  }, [revokeBlobUrls]);

  /** 保存时将 blob URLs 还原为 indexeddb:// 占位符 */
  const unresolveImageUrls = useCallback((text: string) => {
    let raw = text;
    blobUrlsRef.current.forEach((blobUrl, imgId) => {
      raw = raw.replaceAll(blobUrl, `indexeddb://${imgId}`);
    });
    return raw;
  }, []);

  /** 处理图片文件（粘贴或拖拽） */
  const handleImageFiles = useCallback(async (files: File[]) => {
    if (!activeId) return;
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    let insertText = '';
    for (const file of imageFiles) {
      const imgId = crypto.randomUUID();
      const imgRecord: ReportImage = {
        id: imgId,
        reportId: activeId,
        blob: file,
        name: file.name || 'pasted-image.png',
        mimeType: file.type,
        createdAt: Date.now(),
      };
      await db.images.add(imgRecord);
      const blobUrl = URL.createObjectURL(file);
      blobUrlsRef.current.set(imgId, blobUrl);
      insertText += `![${imgRecord.name}](${blobUrl})\n`;
    }
    // 将图片 markdown 插入到编辑器当前内容末尾
    setContent((prev) => prev + '\n' + insertText);
    setDirty(true);
    scheduleSave();
    message.success(t('devtools.reportWriter.messages.imagesPasted', { count: imageFiles.length }));
  }, [activeId, t]);

  // 组件卸载时释放 blob URLs
  useEffect(() => {
    return () => revokeBlobUrls();
  }, [revokeBlobUrls]);

  /** 加载报告列表 */
  const loadReports = useCallback(async () => {
    const list = await db.reports.orderBy('updatedAt').reverse().toArray();
    setReports(list);
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  /** 选中报告 */
  const selectReport = useCallback(async (r: Report) => {
    setActiveId(r.id);
    setTitle(r.title);
    const resolved = await resolveImageUrls(r.id, r.content);
    setContent(resolved);
    setDirty(false);
  }, [resolveImageUrls]);

  /** 新建报告 */
  const handleCreate = useCallback(async () => {
    const now = Date.now();
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const newReport: Report = {
      id: crypto.randomUUID(),
      title: t('devtools.reportWriter.defaults.untitledReport', {
        date: new Date().toLocaleDateString(locale),
      }),
      content: t('devtools.reportWriter.defaults.initialContent'),
      createdAt: now,
      updatedAt: now,
    };
    await db.reports.add(newReport);
    await loadReports();
    selectReport(newReport);
    message.success(t('devtools.reportWriter.messages.created'));
  }, [i18n.language, i18n.resolvedLanguage, loadReports, selectReport, t]);

  /** 保存报告（将 blob URL 还原为 indexeddb:// 占位符再存储） */
  const handleSave = useCallback(async () => {
    if (!activeId) return;
    const rawContent = unresolveImageUrls(content);
    await db.reports.update(activeId, {
      title,
      content: rawContent,
      updatedAt: Date.now(),
    });
    setDirty(false);
    await loadReports();
    message.success(t('common.feedback.saveSuccess'));
  }, [activeId, content, loadReports, t, title, unresolveImageUrls]);

  /** 自动保存（防抖 2s） */
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      handleSave();
    }, 2000);
  }, [handleSave]);

  /** 删除报告（同时清理关联图片） */
  const handleDelete = useCallback(async (id: string) => {
    await db.images.where('reportId').equals(id).delete();
    await db.reports.delete(id);
    if (activeId === id) {
      revokeBlobUrls();
      setActiveId(null);
      setTitle('');
      setContent('');
      setDirty(false);
    }
    await loadReports();
    message.success(t('common.feedback.deleteSuccess'));
  }, [activeId, loadReports, revokeBlobUrls, t]);

  /** 获取内联了 base64 图片的 Markdown 内容 */
  const getExportMarkdown = useCallback(async () => {
    if (!activeId) return '';
    let exportContent = unresolveImageUrls(content);
    const images = await db.images.where('reportId').equals(activeId).toArray();
    for (const img of images) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(img.blob);
      });
      exportContent = exportContent.replaceAll(`indexeddb://${img.id}`, base64);
    }
    return exportContent;
  }, [activeId, content, unresolveImageUrls]);

  /** 构建完整的 HTML 页面（带样式） */
  const buildHtmlPage = useCallback((htmlBody: string, reportTitle: string, lang: string) => {
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${reportTitle}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a; line-height: 1.75; background: #fff; }
  h1 { font-size: 2em; border-bottom: 2px solid #e8e8e8; padding-bottom: .3em; margin-top: 1.5em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid #f0f0f0; padding-bottom: .25em; margin-top: 1.3em; }
  h3 { font-size: 1.25em; margin-top: 1.2em; }
  code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid #e8e8e8; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #177ddc; padding: 8px 16px; margin: 16px 0; background: #f6faff; color: #434343; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; }
  th, td { border: 1px solid #e8e8e8; padding: 8px 12px; text-align: left; }
  th { background: #fafafa; font-weight: 600; }
  img { max-width: 100%; border-radius: 6px; margin: 8px 0; }
  a { color: #177ddc; text-decoration: none; }
  a:hover { text-decoration: underline; }
  hr { border: none; border-top: 1px solid #e8e8e8; margin: 24px 0; }
  ul, ol { padding-left: 2em; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>${htmlBody}</body>
</html>`;
  }, []);

  /** 导出 Markdown */
  const handleExportMd = useCallback(async () => {
    if (!activeId) return;
    const exportContent = await getExportMarkdown();
    const blob = new Blob([exportContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const defaultFileName = t('devtools.reportWriter.export.defaultFileName');
    a.href = url;
    a.download = `${title || defaultFileName}.md`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(t('devtools.reportWriter.messages.markdownExported'));
  }, [activeId, getExportMarkdown, t, title]);

  /** 导出 HTML */
  const handleExportHtml = useCallback(async () => {
    if (!activeId) return;
    const md = await getExportMarkdown();
    const htmlBody = await marked.parse(md);
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const htmlLang = locale.startsWith('en') ? 'en' : 'zh-CN';
    const defaultFileName = t('devtools.reportWriter.export.defaultFileName');
    const fullHtml = buildHtmlPage(htmlBody, title || defaultFileName, htmlLang);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || defaultFileName}.html`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(t('devtools.reportWriter.messages.htmlExported'));
  }, [activeId, buildHtmlPage, getExportMarkdown, i18n.language, i18n.resolvedLanguage, t, title]);

  /** 导出 PDF（使用 html2pdf.js） */
  const handleExportPdf = useCallback(async () => {
    if (!activeId) return;
    const md = await getExportMarkdown();
    const htmlBody = await marked.parse(md);
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const htmlLang = locale.startsWith('en') ? 'en' : 'zh-CN';
    const defaultFileName = t('devtools.reportWriter.export.defaultFileName');
    const fullHtml = buildHtmlPage(htmlBody, title || defaultFileName, htmlLang);
    // 创建临时容器渲染 HTML
    const container = document.createElement('div');
    container.innerHTML = fullHtml;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);
    try {
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${title || defaultFileName}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .save();
      message.success(t('devtools.reportWriter.messages.pdfExported'));
    } catch {
      message.error(t('devtools.reportWriter.messages.pdfExportFailed'));
    } finally {
      document.body.removeChild(container);
    }
  }, [activeId, buildHtmlPage, getExportMarkdown, i18n.language, i18n.resolvedLanguage, t, title]);

  /** 导出菜单项 */
  const exportMenuItems: MenuProps['items'] = [
    { key: 'md', icon: <FileMarkdownOutlined />, label: t('devtools.reportWriter.export.menu.markdown'), onClick: handleExportMd },
    { key: 'html', icon: <Html5Outlined />, label: t('devtools.reportWriter.export.menu.html'), onClick: handleExportHtml },
    { key: 'pdf', icon: <FilePdfOutlined />, label: t('devtools.reportWriter.export.menu.pdf'), onClick: handleExportPdf },
  ];

  /** 粘贴事件处理 */
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files);
    if (files.some((f) => f.type.startsWith('image/'))) {
      e.preventDefault();
      handleImageFiles(files);
    }
  }, [handleImageFiles]);

  /** 拖拽事件处理 */
  const handleDrop = useCallback((e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files);
    if (files.some((f) => f.type.startsWith('image/'))) {
      e.preventDefault();
      handleImageFiles(files);
    }
  }, [handleImageFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
    }
  }, []);

  /** 内容变更 */
  const onContentChange = useCallback((val?: string) => {
    setContent(val ?? '');
    setDirty(true);
    scheduleSave();
  }, [scheduleSave]);

  /** 标题变更 */
  const onTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setDirty(true);
    scheduleSave();
  }, [scheduleSave]);

  /** 格式化时间 */
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const locale = i18n.resolvedLanguage ?? i18n.language;
    return `${d.toLocaleDateString(locale)} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  };

  const activeReport = reports.find((r) => r.id === activeId);

  return (
    <div className="flex h-full bg-white">
      {/* 左侧报告列表 */}
      <div className="flex flex-col w-52 shrink-0 border-r border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200">
          <span className="text-[10px] font-bold text-gray-500 tracking-wide">{t('devtools.reportWriter.sidebar.title')}</span>
          <Tooltip title={t('devtools.reportWriter.tooltips.createReport')}>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleCreate} />
          </Tooltip>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {reports.length === 0 ? (
            <Empty description={t('devtools.reportWriter.empty.list')} image={Empty.PRESENTED_IMAGE_SIMPLE} className="mt-8" />
          ) : (
            reports.map((r) => {
              const isActive = r.id === activeId;
              return (
                <div
                  key={r.id}
                  className={`group flex items-start gap-2 px-2 py-2 mx-1 rounded cursor-pointer transition-colors duration-100
                    ${isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100 border border-transparent'}`}
                  onClick={() => selectReport(r)}
                >
                  <FileTextOutlined className={`mt-0.5 text-xs ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs truncate font-medium ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>
                      {r.title}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{formatTime(r.updatedAt)}</div>
                  </div>
                  <Popconfirm
                    title={t('devtools.reportWriter.confirm.delete')}
                    onConfirm={(e) => { e?.stopPropagation(); handleDelete(r.id); }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText={t('common.actions.confirm')}
                    cancelText={t('common.actions.cancel')}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 右侧编辑区 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeReport ? (
          <>
            {/* 工具栏 */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-gray-50 shrink-0">
              <Input
                value={title}
                onChange={onTitleChange}
                placeholder={t('devtools.reportWriter.fields.titlePlaceholder')}
                size="small"
                className="flex-1 max-w-xs font-medium"
                variant="borderless"
              />
              <div className="flex-1" />
              {dirty && <span className="text-[10px] text-orange-400">● {t('devtools.reportWriter.status.unsaved')}</span>}
              <Tooltip title={t('devtools.reportWriter.tooltips.saveWithAutosave')}>
                <Button size="small" icon={<SaveOutlined />} onClick={handleSave}>
                  {t('common.actions.save')}
                </Button>
              </Tooltip>
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <Button size="small" icon={<ExportOutlined />}>
                  {t('common.actions.export')} ▾
                </Button>
              </Dropdown>
            </div>

            {/* Markdown 编辑器（支持粘贴/拖拽图片） */}
            <div
              ref={editorRef}
              className="flex-1 overflow-hidden"
              data-color-mode="light"
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <MDEditor
                value={content}
                onChange={onContentChange}
                height="100%"
                visibleDragbar={false}
                preview="live"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <FileTextOutlined style={{ fontSize: 48 }} />
            <span className="text-sm">{t('devtools.reportWriter.empty.startWriting')}</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              {t('devtools.reportWriter.buttons.createReport')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
