import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

interface NotificationProps {
  message: string | ReactNode;
  type?: "success" | "error" | "info";
  isVisible: boolean;
  onClose?: () => void;
}

export function Notification({
  message,
  type = "info",
  isVisible,
  onClose
}: NotificationProps) {
  const colors = {
    success: "bg-green-500/10 border-green-500/20 text-green-400",
    error: "bg-red-500/10 border-red-500/20 text-red-400",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-400"
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border ${colors[type]} shadow-lg`}
          onClick={onClose}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
