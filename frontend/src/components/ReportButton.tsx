import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { reportAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface ReportButtonProps {
  type: 'user' | 'comment' | 'event';
  targetId: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const ReportButton: React.FC<ReportButtonProps> = ({
  type,
  targetId,
  className = '',
  size = 'sm'
}) => {
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const reportMutation = useMutation({
    mutationFn: (data: { reason: string; description?: string }) =>
      reportAPI.createReport({
        type,
        target_id: targetId,
        reason: data.reason,
        description: data.description || undefined
      }),
    onSuccess: (data) => {
      showSuccess(data.message);
      setShowModal(false);
      setReason('');
      setDescription('');
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || '通報に失敗しました');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showError('通報理由を選択してください');
      return;
    }
    reportMutation.mutate({ reason, description: description.trim() });
  };

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      showError('通報するにはログインが必要です');
      return;
    }
    setShowModal(true);
  };

  const reasonOptions = {
    user: [
      '不適切なプロフィール',
      'スパム行為',
      '嫌がらせ',
      '偽のアカウント',
      'その他'
    ],
    comment: [
      '不適切な内容',
      'スパム',
      '嫌がらせ',
      '個人情報の公開',
      'その他'
    ],
    event: [
      '偽のイベント',
      '不適切な内容',
      'スパム',
      '著作権侵害',
      'その他'
    ]
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5'
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`
          ${sizeClasses[size]}
          text-red-600 hover:text-red-800 hover:bg-red-50 
          rounded transition-colors
          ${className}
        `}
        title="通報する"
      >
        🚩 通報
      </button>

      {/* 通報モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              通報する
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通報理由 *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">理由を選択してください</option>
                  {reasonOptions[type].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  詳細説明（任意）
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="具体的な問題について詳しく説明してください（任意）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {description.length}/1000文字
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={reportMutation.isPending || !reason.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {reportMutation.isPending ? '送信中...' : '通報する'}
                </button>
              </div>
            </form>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800">
                通報は管理者によって確認され、適切に対応されます。
                虚偽の通報は禁止されており、アカウントの停止対象となる場合があります。
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};