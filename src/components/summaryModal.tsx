"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HelpCircleIcon } from "lucide-react";

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSummarize: (options: SummaryOptions) => void;
}

interface SummaryOptions {
  type: "key-points" | "tl;dr" | "teaser" | "headline";
  format: "markdown" | "plain-text";
  length: "short" | "medium" | "long";
}

const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  onSummarize,
}) => {
  const [options, setOptions] = useState<SummaryOptions>({
    type: "key-points",
    format: "markdown",
    length: "medium",
  });

  const handleOptionChange = (field: keyof SummaryOptions, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [field]: value as SummaryOptions[typeof field],
    }));
  };

  const handleSummarize = () => {
    onSummarize(options);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-6 rounded-lg shadow-xl w-[90%] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Customize Summary
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {/* Type Selection */}
          <label className="block">
            Type:
            <select
              value={options.type}
              onChange={(e) => handleOptionChange("type", e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="key-points">Key Points</option>
              <option value="tl;dr">TL;DR</option>
              <option value="teaser">Teaser</option>
              <option value="headline">Headline</option>
            </select>
          </label>

          {/* Format Selection */}
          <label className="block">
            Format:
            <select
              value={options.format}
              onChange={(e) => handleOptionChange("format", e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="markdown">Markdown</option>
              <option value="plain-text">Plain Text</option>
            </select>
          </label>

          {/* Length Selection */}
          <label className="block">
            Length:
            <select
              value={options.length}
              onChange={(e) => handleOptionChange("length", e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </label>
        </div>

        {/* Footer Buttons */}
        <div className="mt-4 flex justify-between items-center">
          {/* Tooltip for FAQ */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-blue-500 text-sm">
                <HelpCircleIcon />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Choose summary type, format, and length.</p>
              <p>
                Example: 'Key Points' gives bullet points, 'TL;DR' is a short
                summary.
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleSummarize}
              className="bg-[#51DA4C] text-white"
            >
              Summarize
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal;
