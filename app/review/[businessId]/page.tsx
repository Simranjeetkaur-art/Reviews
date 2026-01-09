"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Star,
  Copy,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Loader2,
  QrCode,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

interface Feedback {
  id: string;
  content: string;
  sentiment: string;
  category: string;
}

interface BusinessData {
  businessName: string;
  googleMapsUrl: string;
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const resolvedParams = React.use(params);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [reviewPageUrl, setReviewPageUrl] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get the current page URL for QR code
    if (typeof window !== "undefined") {
      setReviewPageUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Track QR scan
      await fetch(`/api/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: resolvedParams.businessId,
          eventType: "qr_scan",
        }),
      });

      // Load feedbacks and business data
      const response = await fetch(
        `/api/feedbacks/${resolvedParams.businessId}`,
      );
      const data = await response.json();

      if (data.success) {
        setFeedbacks(data.feedbacks);
        setBusiness(data.business);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFeedback = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setCopied(false);
  };

  const handleCopyAndContinue = async () => {
    if (!selectedFeedback || !business?.googleMapsUrl) return;

    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(selectedFeedback.content);
      setCopied(true);

      // Track feedback selected event
      await fetch(`/api/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: resolvedParams.businessId,
          eventType: "feedback_selected",
          feedbackId: selectedFeedback.id,
        }),
      });

      // Track Google redirect event
      await fetch(`/api/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: resolvedParams.businessId,
          eventType: "google_redirect",
        }),
      });

      // Small delay to show copied state, then redirect
      setTimeout(() => {
        window.open(business.googleMapsUrl, "_blank");
      }, 500);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-500 animate-spin" />
          <p className="text-slate-300 font-medium">Loading reviews...</p>
        </motion.div>
      </div>
    );
  }

  if (!business || feedbacks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-8 max-w-md text-center shadow-lg border border-slate-700">
          <Store className="w-16 h-16 mx-auto text-indigo-400 mb-4" />
          <p className="text-slate-300">
            No reviews available for this business.
          </p>
        </div>
      </div>
    );
  }

  // Render 5 stars for positive, 4 stars for neutral
  const renderStars = (sentiment: string) => {
    const count = sentiment === "positive" ? 5 : 4;
    return (
      <div className="flex gap-1 mt-2">
        {Array.from({ length: count }).map((_, i) => (
          <svg
            key={i}
            className="w-5 h-5 text-yellow-400 fill-yellow-400"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {sentiment !== "positive" && (
          <svg
            className="w-5 h-5 text-slate-600 fill-slate-600"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 w-full overflow-x-hidden">
      {/* Header Navigation */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-white">
              ReviewBoost
            </span>
          </Link>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-indigo-500/20 rounded-full flex items-center justify-center border-2 border-indigo-500/30">
                <Store className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400" />
              </div>
            </motion.div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 break-words">
              {business.businessName}
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-400 mb-4">
              Share Your Experience
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto">
              Thank you for visiting us! Please select a review that best
              matches your experience, and we'll help you share it on Google
              Reviews.
            </p>
          </div>

          {/* QR Code Section for Business Owners */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-2 flex items-center justify-center sm:justify-start gap-2">
                    <QrCode className="w-5 h-5 text-indigo-400" />
                    Scan to Access Review Templates
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Business owners: Show this QR code to customers for easy
                    access
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    {showQR ? "Hide QR" : "Show QR"}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showQR && reviewPageUrl && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-slate-700 overflow-hidden"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        ref={qrRef}
                        className="bg-white p-4 rounded-lg mb-4 inline-block"
                      >
                        <QRCodeSVG
                          value={reviewPageUrl}
                          size={200}
                          level="H"
                          includeMargin={true}
                          fgColor="#4f46e5"
                          bgColor="#ffffff"
                        />
                      </div>
                      <p className="text-xs text-slate-400 mb-3 text-center max-w-xs break-all">
                        {reviewPageUrl}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!qrRef.current) return;
                          const svg = qrRef.current.querySelector("svg");
                          if (!svg) return;

                          const svgData = new XMLSerializer().serializeToString(
                            svg,
                          );
                          const canvas = document.createElement("canvas");
                          const ctx = canvas.getContext("2d");
                          const img = new Image();

                          const svgBlob = new Blob([svgData], {
                            type: "image/svg+xml;charset=utf-8",
                          });
                          const blobUrl = URL.createObjectURL(svgBlob);

                          img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            if (ctx) {
                              ctx.drawImage(img, 0, 0);
                              canvas.toBlob((blob) => {
                                if (blob) {
                                  const link = document.createElement("a");
                                  link.download = `${business.businessName.replace(/[^a-z0-9]/gi, "_")}-review-qr-code.png`;
                                  link.href = URL.createObjectURL(blob);
                                  link.click();
                                  URL.revokeObjectURL(link.href);
                                }
                                URL.revokeObjectURL(blobUrl);
                              });
                            }
                          };
                          img.src = blobUrl;
                        }}
                        className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download QR Code
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Choose Your Review Section */}
          <div className="text-center mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-200 flex items-center justify-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              Choose Your Review
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </h3>
          </div>

          {/* Review Cards */}
          <div className="space-y-4 mb-8">
            <AnimatePresence>
              {feedbacks.map((feedback, index) => (
                <React.Fragment key={feedback.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <button
                      onClick={() => handleSelectFeedback(feedback)}
                      className={`w-full text-left transition-all duration-300 rounded-xl p-4 sm:p-6 ${
                        selectedFeedback?.id === feedback.id
                          ? "bg-indigo-500/20 ring-2 ring-indigo-400 shadow-lg border border-indigo-500/30"
                          : "bg-slate-900/50 border border-slate-700 hover:bg-slate-800/50 hover:border-indigo-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 text-base sm:text-lg leading-relaxed mb-3 break-words">
                            "{feedback.content}"
                          </p>
                          {renderStars(feedback.sentiment)}
                        </div>
                        {selectedFeedback?.id === feedback.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex-shrink-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </button>
                  </motion.div>

                  {/* Copy & Continue Button - appears immediately after selected feedback */}
                  {selectedFeedback?.id === feedback.id && (
                    <motion.div
                      key={`button-${feedback.id}`}
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                      className="overflow-hidden"
                    >
                      <Button
                        size="lg"
                        onClick={handleCopyAndContinue}
                        disabled={copied}
                        className={`w-full py-4 sm:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-xl transition-all duration-300 ${
                          copied
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                        } text-white`}
                      >
                        {copied ? (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                            Copied! Opening Google Reviews...
                          </motion.span>
                        ) : (
                          <span className="flex items-center justify-center gap-2 sm:gap-3">
                            <Copy className="w-5 h-5 sm:w-6 sm:h-6" />
                            Copy & Continue to Google
                            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8 pt-8 border-t border-slate-700/50"
          >
            <p className="text-sm text-slate-400">
              Powered by{" "}
              <Link
                href="/"
                className="font-semibold text-indigo-400 hover:text-indigo-300"
              >
                ReviewBoost
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
