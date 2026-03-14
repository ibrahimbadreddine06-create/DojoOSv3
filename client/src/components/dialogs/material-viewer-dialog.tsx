import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import type { Material } from "@shared/schema";
import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";

interface MaterialViewerDialogProps {
    material: Material | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MaterialViewerDialog({ material, open, onOpenChange }: MaterialViewerDialogProps) {
    const [iframeLoading, setIframeLoading] = useState(true);

    if (!material) return null;

    const hasUploadedFile = !!(material as any).fileData;
    const isVideo = material.type === "video";
    const isPdf = material.type === "pdf";
    const isImage = material.type === "file" && hasUploadedFile && (
        (material as any).fileData.startsWith("data:image/")
    );

    // Try to render link in iframe if possible
    const isLink = material.type === "link";

    const contentUrl = hasUploadedFile ? (material as any).fileData : material.url;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl w-full h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            {material.title}
                        </DialogTitle>
                    </div>

                    <div className="flex items-center gap-2">
                        {!hasUploadedFile && material.url && (
                            <Button variant="outline" size="sm" asChild>
                                <a href={material.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open in New Tab
                                </a>
                            </Button>
                        )}

                        {hasUploadedFile && (
                            <Button variant="outline" size="sm" asChild>
                                <a href={(material as any).fileData} download={(material as any).fileName || material.title}>
                                    Download
                                </a>
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto bg-muted/30 relative flex items-center justify-center p-4">
                    {isVideo && (
                        <video
                            controls
                            className="w-full h-full object-contain rounded-md"
                            src={contentUrl}
                        />
                    )}

                    {isImage && (
                        <img
                            src={contentUrl}
                            alt={material.title}
                            className="max-w-full max-h-full object-contain rounded-md shadow-md"
                        />
                    )}

                    {isPdf && (
                        <iframe
                            src={`${contentUrl}#view=FitH`}
                            className="w-full h-full rounded-md border bg-white"
                            title={material.title}
                        />
                    )}

                    {isLink && (
                        <>
                            {iframeLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}
                            <iframe
                                src={contentUrl}
                                className="w-full h-full rounded-md border bg-white"
                                title={material.title}
                                onLoad={() => setIframeLoading(false)}
                                onError={() => setIframeLoading(false)}
                            />
                        </>
                    )}

                    {(!isVideo && !isImage && !isPdf && !isLink && material.type === "file") && (
                        <div className="text-center p-8 bg-background rounded-lg border shadow-sm max-w-sm">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ExternalLink className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">File Viewer Not Available</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                This type of file cannot be previewed directly in the browser.
                                Please download it to view its contents.
                            </p>
                            <Button asChild>
                                <a href={(material as any).fileData} download={(material as any).fileName || material.title}>
                                    Download File
                                </a>
                            </Button>
                        </div>
                    )}
                </div>

                {material.content && (
                    <div className="p-4 border-t bg-background shrink-0 max-h-48 overflow-y-auto">
                        <h4 className="text-sm font-semibold mb-2">Notes</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{material.content}</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

