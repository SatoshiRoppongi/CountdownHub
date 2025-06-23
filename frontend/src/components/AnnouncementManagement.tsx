import React, { useState } from 'react';
import { useAnnouncementsAdmin, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from '../hooks/useAnnouncements';
import { useToast } from '../contexts/ToastContext';
import { Announcement, AnnouncementType, AnnouncementPriority } from '../types';

interface AnnouncementFormData {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

const defaultFormData: AnnouncementFormData = {
  title: '',
  content: '',
  type: 'info',
  priority: 'normal',
  is_active: true,
  start_date: '',
  end_date: ''
};

export const AnnouncementManagement: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>(defaultFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
  const { showSuccess, showError } = useToast();

  const { data, isLoading, refetch } = useAnnouncementsAdmin({ page: 1, limit: 50 });
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const announcements = data?.announcements || [];

  const getTypeLabel = (type: AnnouncementType): string => {
    const labels = {
      info: '情報',
      maintenance: 'メンテナンス',
      feature: '新機能',
      warning: '警告',
      emergency: '緊急'
    };
    return labels[type];
  };

  const getPriorityLabel = (priority: AnnouncementPriority): string => {
    const labels = {
      low: '低',
      normal: '通常',
      high: '高',
      urgent: '緊急'
    };
    return labels[priority];
  };

  const getPriorityColor = (priority: AnnouncementPriority): string => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      if (editingAnnouncement) {
        await updateMutation.mutateAsync({ id: editingAnnouncement.id, ...submitData });
        showSuccess('お知らせを更新しました');
      } else {
        await createMutation.mutateAsync(submitData);
        showSuccess('お知らせを作成しました');
      }

      resetForm();
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'エラーが発生しました';
      showError(message);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      is_active: announcement.is_active,
      start_date: announcement.start_date ? announcement.start_date.slice(0, 16) : '',
      end_date: announcement.end_date ? announcement.end_date.slice(0, 16) : ''
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;

    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      showSuccess('お知らせを削除しました');
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : '削除に失敗しました';
      showError(message);
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingAnnouncement(null);
    setIsFormOpen(false);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">お知らせ管理</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          新規作成
        </button>
      </div>

      {/* お知らせ一覧 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {announcements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    種別
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    優先度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {announcements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {announcement.content}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {getTypeLabel(announcement.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(announcement.priority)}`}>
                        {getPriorityLabel(announcement.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        announcement.is_active 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-gray-600 bg-gray-50'
                      }`}>
                        {announcement.is_active ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(announcement.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteClick(announcement.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              お知らせがありません
            </h3>
            <p className="text-gray-600">
              最初のお知らせを作成してください。
            </p>
          </div>
        )}
      </div>

      {/* フォームモーダル */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingAnnouncement ? 'お知らせ編集' : 'お知らせ作成'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    種別
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as AnnouncementType }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="info">情報</option>
                    <option value="maintenance">メンテナンス</option>
                    <option value="feature">新機能</option>
                    <option value="warning">警告</option>
                    <option value="emergency">緊急</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    優先度
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as AnnouncementPriority }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">低</option>
                    <option value="normal">通常</option>
                    <option value="high">高</option>
                    <option value="urgent">緊急</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    表示開始日時
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    表示終了日時
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  有効にする
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? '保存中...' : 
                   (editingAnnouncement ? '更新' : '作成')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                お知らせを削除
              </h3>
              <p className="text-gray-600 mb-6">
                このお知らせを削除しますか？この操作は取り消せません。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};