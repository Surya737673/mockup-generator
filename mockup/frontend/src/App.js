import React, { useState, useRef, useCallback } from 'react';
import './App.css';

const App = () => {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [logoPosition, setLogoPosition] = useState({ x: 50, y: 50 });
  const [logoSize, setLogoSize] = useState({ width: 100, height: 100 });
  const [logoRotation, setLogoRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Text display options
  const [showSizeText, setShowSizeText] = useState(true);
  const [textPosition, setTextPosition] = useState('below'); // 'below', 'above', 'left', 'right', 'custom'
  const [customTextPosition, setCustomTextPosition] = useState({ x: 0, y: 0 });
  const [textStyle, setTextStyle] = useState({
    fontSize: 14,
    color: '#000000',
    backgroundColor: 'rgba(255, 255, 255, 0.8)'
  });
  
  const canvasRef = useRef(null);
  const logoRef = useRef(null);
  const containerRef = useRef(null);

  const handleImageUpload = (event, type) => {
    const file = event.target.files[0];
    if (file && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (type === 'background') {
            setBackgroundImage(img);
          } else {
            setLogoImage(img);
            // Auto-size logo to reasonable dimensions
            const aspectRatio = img.width / img.height;
            if (img.width > img.height) {
              setLogoSize({ width: 100, height: Math.round(100 / aspectRatio) });
            } else {
              setLogoSize({ width: Math.round(100 * aspectRatio), height: 100 });
            }
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload PNG, JPG, or WebP images only.');
    }
  };

  const handleMouseDown = (e) => {
    if (!logoImage) return;
    
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    const logoRect = logoRef.current.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - logoRect.left,
      y: e.clientY - logoRect.top
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let newX = e.clientX - rect.left - dragOffset.x;
    let newY = e.clientY - rect.top - dragOffset.y;
    
    // Snap to grid
    newX = Math.round(newX / 10) * 10;
    newY = Math.round(newY / 10) * 10;
    
    // Keep logo within bounds
    const maxX = rect.width - logoSize.width;
    const maxY = rect.height - logoSize.height;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    setLogoPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset, logoSize]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  const handleSizeChange = (dimension, value) => {
    const newValue = Math.max(10, parseInt(value) || 10);
    setLogoSize(prev => ({
      ...prev,
      [dimension]: newValue
    }));
  };

  const exportImage = () => {
    if (!backgroundImage) {
      alert('Please upload a background image first.');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match background image
    canvas.width = backgroundImage.width;
    canvas.height = backgroundImage.height;
    
    // Draw background image
    ctx.drawImage(backgroundImage, 0, 0);
    
    // Draw logo if it exists
    if (logoImage) {
      const scaleX = backgroundImage.width / containerRef.current.offsetWidth;
      const scaleY = backgroundImage.height / containerRef.current.offsetHeight;
      
      const scaledX = logoPosition.x * scaleX;
      const scaledY = logoPosition.y * scaleY;
      const scaledWidth = logoSize.width * scaleX;
      const scaledHeight = logoSize.height * scaleY;
      
      // Save context for rotation
      ctx.save();
      
      // Move to logo center for rotation
      const centerX = scaledX + scaledWidth / 2;
      const centerY = scaledY + scaledHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((logoRotation * Math.PI) / 180);
      
      // Draw logo centered at origin
      ctx.drawImage(logoImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      
      // Draw size text if enabled
      if (showSizeText) {
        const textContent = `${logoSize.width}×${logoSize.height}px`;
        const fontSize = textStyle.fontSize * scaleX;
        
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = textStyle.backgroundColor;
        ctx.strokeStyle = textStyle.color;
        ctx.lineWidth = 1;
        
        const textMetrics = ctx.measureText(textContent);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        
        // Calculate text position
        let textX = 0;
        let textY = 0;
        
        if (textPosition === 'below') {
          textX = -textWidth / 2;
          textY = scaledHeight / 2 + textHeight + 5 * scaleY;
        } else if (textPosition === 'above') {
          textX = -textWidth / 2;
          textY = -scaledHeight / 2 - 5 * scaleY;
        } else if (textPosition === 'left') {
          textX = -scaledWidth / 2 - textWidth - 5 * scaleX;
          textY = textHeight / 2;
        } else if (textPosition === 'right') {
          textX = scaledWidth / 2 + 5 * scaleX;
          textY = textHeight / 2;
        } else if (textPosition === 'custom') {
          textX = (customTextPosition.x - logoPosition.x) * scaleX - scaledWidth / 2;
          textY = (customTextPosition.y - logoPosition.y) * scaleY - scaledHeight / 2 + textHeight / 2;
        }
        
        // Draw text background
        ctx.fillRect(textX - 2, textY - textHeight, textWidth + 4, textHeight + 4);
        
        // Draw text
        ctx.fillStyle = textStyle.color;
        ctx.fillText(textContent, textX, textY);
      }
      
      ctx.restore();
    }
    
    // Export as PNG
    const link = document.createElement('a');
    link.download = 'composite-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const calculateTextPosition = () => {
    if (!showSizeText) return null;
    
    const textContent = `${logoSize.width}×${logoSize.height}px`;
    let textX = 0;
    let textY = 0;
    
    if (textPosition === 'below') {
      textX = logoPosition.x + logoSize.width / 2;
      textY = logoPosition.y + logoSize.height + 20;
    } else if (textPosition === 'above') {
      textX = logoPosition.x + logoSize.width / 2;
      textY = logoPosition.y - 5;
    } else if (textPosition === 'left') {
      textX = logoPosition.x - 5;
      textY = logoPosition.y + logoSize.height / 2 + textStyle.fontSize / 2;
    } else if (textPosition === 'right') {
      textX = logoPosition.x + logoSize.width + 5;
      textY = logoPosition.y + logoSize.height / 2 + textStyle.fontSize / 2;
    } else if (textPosition === 'custom') {
      textX = customTextPosition.x;
      textY = customTextPosition.y;
    }
    
    return { textContent, textX, textY };
  };

  const GridOverlay = () => {
    if (!showGrid || !backgroundImage) return null;
    
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return null;
    
    const lines = [];
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;
    
    // Vertical lines
    for (let x = 0; x <= width; x += 10) {
      lines.push(
        <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={height} stroke="#00ff00" strokeWidth="0.5" opacity="0.3" />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += 10) {
      lines.push(
        <line key={`h-${y}`} x1={0} y1={y} x2={width} y2={y} stroke="#00ff00" strokeWidth="0.5" opacity="0.3" />
      );
    }
    
    return (
      <svg 
        className="absolute inset-0 pointer-events-none z-10"
        width={width}
        height={height}
      >
        {lines}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Image Logo Overlay Tool
        </h1>
        
        {/* Upload Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Image (PNG, JPG, WebP)
              </label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => handleImageUpload(e, 'background')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo Image (PNG, JPG, WebP)
              </label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => handleImageUpload(e, 'logo')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        {backgroundImage && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Canvas</h2>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="mr-2"
                  />
                  Show Grid (10px)
                </label>
                <button
                  onClick={exportImage}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Download Composite
                </button>
              </div>
            </div>
            
            <div 
              ref={containerRef}
              className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50"
              style={{
                width: '800px',
                height: `${(backgroundImage.height * 800) / backgroundImage.width}px`,
                maxHeight: '600px',
                margin: '0 auto'
              }}
            >
              {/* Background Image */}
              <img
                src={backgroundImage.src}
                alt="Background"
                className="w-full h-full object-contain"
                draggable={false}
              />
              
              {/* Grid Overlay */}
              <GridOverlay />
              
              {/* Logo */}
              {logoImage && (
                <>
                  <div
                    ref={logoRef}
                    className={`absolute cursor-move border-2 border-blue-500 ${isDragging ? 'border-blue-700' : ''}`}
                    style={{
                      left: `${logoPosition.x}px`,
                      top: `${logoPosition.y}px`,
                      width: `${logoSize.width}px`,
                      height: `${logoSize.height}px`,
                      transform: `rotate(${logoRotation}deg)`,
                      transformOrigin: 'center',
                      zIndex: 20
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    <img
                      src={logoImage.src}
                      alt="Logo"
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </div>
                  
                  {/* Size Text Display */}
                  {showSizeText && (() => {
                    const textData = calculateTextPosition();
                    if (!textData) return null;
                    
                    return (
                      <div
                        className="absolute pointer-events-none select-none z-30"
                        style={{
                          left: `${textData.textX}px`,
                          top: `${textData.textY}px`,
                          fontSize: `${textStyle.fontSize}px`,
                          color: textStyle.color,
                          backgroundColor: textStyle.backgroundColor,
                          padding: '2px 4px',
                          borderRadius: '3px',
                          transform: textPosition === 'above' || textPosition === 'below' ? 'translateX(-50%)' : 
                                    textPosition === 'left' ? 'translateX(-100%)' : 'none',
                          fontFamily: 'Arial, sans-serif',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {textData.textContent}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        {/* Controls Panel */}
        {logoImage && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Logo Controls</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Position */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Position (px)</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600">X:</label>
                    <input
                      type="number"
                      value={logoPosition.x}
                      onChange={(e) => setLogoPosition(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Y:</label>
                    <input
                      type="number"
                      value={logoPosition.y}
                      onChange={(e) => setLogoPosition(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Size */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Size (px)</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600">Width:</label>
                    <input
                      type="number"
                      value={logoSize.width}
                      onChange={(e) => handleSizeChange('width', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Height:</label>
                    <input
                      type="number"
                      value={logoSize.height}
                      onChange={(e) => handleSizeChange('height', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Rotation */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Rotation</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600">Angle (°):</label>
                    <input
                      type="number"
                      value={logoRotation}
                      onChange={(e) => setLogoRotation(parseInt(e.target.value) || 0)}
                      min="-180"
                      max="180"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Quick Rotate:</label>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setLogoRotation(prev => prev - 90)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                        title="Rotate -90°"
                      >
                        ↺
                      </button>
                      <button
                        onClick={() => setLogoRotation(0)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                        title="Reset rotation"
                      >
                        0°
                      </button>
                      <button
                        onClick={() => setLogoRotation(prev => prev + 90)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                        title="Rotate +90°"
                      >
                        ↻
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Status */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Current Status</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Coordinates: ({logoPosition.x}, {logoPosition.y})</div>
                  <div>Size: {logoSize.width} × {logoSize.height}</div>
                  <div>Rotation: {logoRotation}°</div>
                  <div>Grid: {showGrid ? 'Enabled' : 'Disabled'}</div>
                  <div className={`${isDragging ? 'text-blue-600 font-medium' : ''}`}>
                    {isDragging ? 'Dragging...' : 'Ready'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Text Display Controls */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-4">Size Text Display</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Text Toggle & Position */}
                <div>
                  <label className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={showSizeText}
                      onChange={(e) => setShowSizeText(e.target.checked)}
                      className="mr-2"
                    />
                    Show size text
                  </label>
                  
                  {showSizeText && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Position:</label>
                      <select
                        value={textPosition}
                        onChange={(e) => setTextPosition(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="below">Below logo</option>
                        <option value="above">Above logo</option>
                        <option value="left">Left of logo</option>
                        <option value="right">Right of logo</option>
                        <option value="custom">Custom position</option>
                      </select>
                    </div>
                  )}
                </div>
                
                {/* Custom Position */}
                {showSizeText && textPosition === 'custom' && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Custom Position:</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="X coordinate"
                        value={customTextPosition.x}
                        onChange={(e) => setCustomTextPosition(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Y coordinate"
                        value={customTextPosition.y}
                        onChange={(e) => setCustomTextPosition(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
                
                {/* Text Styling */}
                {showSizeText && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Text Style:</label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-500">Font Size:</label>
                        <input
                          type="number"
                          value={textStyle.fontSize}
                          onChange={(e) => setTextStyle(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 12 }))}
                          min="8"
                          max="72"
                          className="w-full p-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Text Color:</label>
                        <input
                          type="color"
                          value={textStyle.color}
                          onChange={(e) => setTextStyle(prev => ({ ...prev, color: e.target.value }))}
                          className="w-full h-8 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Use:</h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>Upload a background image (PNG, JPG, or WebP)</li>
            <li>Upload a logo image</li>
            <li>Drag the logo to position it on the background</li>
            <li>Use the grid overlay for precise positioning (10px snap)</li>
            <li>Adjust logo size using the width/height controls</li>
            <li>Rotate the logo using the rotation controls or quick buttons</li>
            <li>Toggle size text display and customize its position and style</li>
            <li>Click "Download Composite" to save the final image with all elements</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-blue-800 text-sm">
              <strong>Pro Tips:</strong> Use the grid for precise alignment • Text can be positioned relative to logo or at custom coordinates • 
              Rotation works with all other features • Export includes all elements at full resolution
            </p>
          </div>
        </div>
      </div>
      
      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default App;