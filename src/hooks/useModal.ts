"use client";

import { useState, useCallback, useMemo } from "react";
import React from "react";
import Modal, { ModalType } from "@/src/components/Modal";

export interface ModalOptions {
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export function useModal() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ModalOptions | null;
  }>({
    isOpen: false,
    options: null,
  });

  const showModal = useCallback((options: ModalOptions) => {
    setModalState({
      isOpen: true,
      options,
    });
  }, []);

  const hideModal = useCallback(() => {
    setModalState({
      isOpen: false,
      options: null,
    });
  }, []);

  const alert = useCallback(
    (message: string, title?: string, type: ModalType = "info") => {
      return new Promise<void>((resolve) => {
        showModal({
          message,
          title,
          type,
          onConfirm: () => {
            resolve();
          },
        });
      });
    },
    [showModal]
  );

  const confirm = useCallback(
    (message: string, title?: string): Promise<boolean> => {
      return new Promise((resolve) => {
        showModal({
          message,
          title: title || "Confirm Action",
          type: "confirm",
          showCancel: true,
          confirmText: "Confirm",
          cancelText: "Cancel",
          onConfirm: () => {
            resolve(true);
          },
          onCancel: () => {
            resolve(false);
          },
        });
      });
    },
    [showModal]
  );

  const ModalComponent = useMemo(() => {
    if (!modalState.options) return null;
    
    return React.createElement(Modal, {
      isOpen: modalState.isOpen,
      onClose: hideModal,
      onConfirm: modalState.options.onConfirm,
      onCancel: modalState.options.onCancel,
      title: modalState.options.title,
      message: modalState.options.message,
      type: modalState.options.type,
      confirmText: modalState.options.confirmText,
      cancelText: modalState.options.cancelText,
      showCancel: modalState.options.type === "confirm" || modalState.options.showCancel,
    });
  }, [modalState, hideModal]);

  return {
    showModal,
    hideModal,
    alert,
    confirm,
    ModalComponent,
  };
}
