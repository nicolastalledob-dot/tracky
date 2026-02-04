'use client'

import { useState, useRef, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react'

interface ImageCropModalProps {
    imageFile: File
    onCrop: (croppedBlob: Blob) => void
    onClose: () => void
}

export default function ImageCropModal({ imageFile, onCrop, onClose }: ImageCropModalProps) {
    const [zoom, setZoom] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [imageUrl, setImageUrl] = useState<string>('')
    const [rotation, setRotation] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Load image URL
    useState(() => {
        const url = URL.createObjectURL(imageFile)
        setImageUrl(url)
        return () => URL.revokeObjectURL(url)
    })

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        })
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0]
        setIsDragging(true)
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return
        const touch = e.touches[0]
        setPosition({
            x: touch.clientX - dragStart.x,
            y: touch.clientY - dragStart.y
        })
    }

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3))
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))
    const handleRotate = () => setRotation(prev => (prev + 90) % 360)

    const handleCrop = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const img = new Image()
        img.onload = () => {
            const size = 256 // Output size
            canvas.width = size
            canvas.height = size

            ctx.fillStyle = '#0f0f0f'
            ctx.fillRect(0, 0, size, size)

            ctx.save()
            ctx.translate(size / 2, size / 2)
            ctx.rotate((rotation * Math.PI) / 180)
            ctx.scale(zoom, zoom)
            ctx.translate(-size / 2 + position.x / 2, -size / 2 + position.y / 2)

            // Draw image centered
            const scale = Math.max(size / img.width, size / img.height)
            const x = (size - img.width * scale) / 2
            const y = (size - img.height * scale) / 2
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

            ctx.restore()

            canvas.toBlob((blob) => {
                if (blob) {
                    onCrop(blob)
                }
            }, 'image/jpeg', 0.9)
        }
        img.src = imageUrl
    }, [imageUrl, zoom, position, rotation, onCrop])

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-semibold">Ajustar foto</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Crop Area */}
                <div className="relative">
                    <div
                        ref={containerRef}
                        className="w-full aspect-square bg-[#0f0f0f] overflow-hidden cursor-move relative"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleMouseUp}
                    >
                        {imageUrl && (
                            <img
                                src={imageUrl}
                                alt="Preview"
                                className="absolute w-full h-full object-cover pointer-events-none"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                                    transformOrigin: 'center center'
                                }}
                                draggable={false}
                            />
                        )}

                        {/* Circle Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                            <svg className="w-full h-full">
                                <defs>
                                    <mask id="circleMask">
                                        <rect width="100%" height="100%" fill="white" />
                                        <circle cx="50%" cy="50%" r="40%" fill="black" />
                                    </mask>
                                </defs>
                                <rect
                                    width="100%"
                                    height="100%"
                                    fill="rgba(0,0,0,0.6)"
                                    mask="url(#circleMask)"
                                />
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="40%"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeDasharray="8 4"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Hidden Canvas */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Controls */}
                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <button
                            onClick={handleZoomOut}
                            className="p-2 rounded-lg bg-[#252525] text-gray-400 hover:text-white transition-colors"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <div className="flex-1 max-w-32">
                            <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full accent-violet-600"
                            />
                        </div>
                        <button
                            onClick={handleZoomIn}
                            className="p-2 rounded-lg bg-[#252525] text-gray-400 hover:text-white transition-colors"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleRotate}
                            className="p-2 rounded-lg bg-[#252525] text-gray-400 hover:text-white transition-colors"
                        >
                            <RotateCw className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mb-4">
                        Arrastra para ajustar la posición
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCrop}
                            className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-medium flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            Aplicar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
