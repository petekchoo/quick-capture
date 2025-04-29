interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm }: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-gray-100 font-mono text-lg mb-4">Delete Entry</h3>
        <p className="text-gray-400 font-mono text-sm mb-6">
          Are you sure you want to delete this entry? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-100 font-mono text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-mono text-sm rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
} 