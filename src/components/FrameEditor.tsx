import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, ArrowRight, ArrowLeft, Download, RotateCcw } from 'lucide-react';
import logo from '@/assets/logo.png';

type Step = 1 | 2 | 3;

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const FrameEditor = () => {
  const [step, setStep] = useState<Step>(1);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [croppedImageUrl, setCroppedImageUrl] = useState('');
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const getCroppedImg = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelRatio = window.devicePixelRatio;
    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Create circular clip
    const centerX = (completedCrop.width * scaleX) / 2;
    const centerY = (completedCrop.height * scaleY) / 2;
    const radius = Math.min(centerX, centerY);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    const dataUrl = canvas.toDataURL('image/png');
    setCroppedImageUrl(dataUrl);
  }, [completedCrop]);

  const handleNext = async () => {
    if (step === 1 && imgSrc) {
      await getCroppedImg();
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;

    try {
      const dataUrl = await toPng(previewRef.current, {
        quality: 1,
        pixelRatio: 3,
      });

      const link = document.createElement('a');
      link.download = `${fullName || 'photo'}-frame.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const handleStartOver = () => {
    setStep(1);
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCroppedImageUrl('');
    setFullName('');
    setDesignation('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderPreview = () => (
    <div
      ref={previewRef}
      className="relative w-[400px] h-[420px] bg-card overflow-hidden shadow-card"
      style={{ backgroundColor: '#FAF8F5' }}
    >
      {/* Top Left Corner Triangle */}
      <div 
        className="absolute top-0 left-0 w-0 h-0"
        style={{
          borderLeft: '50px solid hsl(142, 76%, 45%)',
          borderBottom: '50px solid transparent',
        }}
      />
      <div 
        className="absolute top-12 left-0 w-0 h-0"
        style={{
          borderLeft: '30px solid hsl(142, 76%, 45%)',
          borderBottom: '30px solid transparent',
        }}
      />

      {/* Top Right Corner Lines */}
      <div className="absolute top-4 right-4 w-16 h-16">
        <div 
          className="absolute top-0 right-0 w-12 h-12"
          style={{
            border: '2px solid hsl(142, 76%, 45%)',
            borderLeft: 'none',
            borderBottom: 'none',
          }}
        />
        <div 
          className="absolute top-2 right-2 w-8 h-8"
          style={{
            border: '2px solid hsl(142, 76%, 45%)',
            borderLeft: 'none',
            borderBottom: 'none',
          }}
        />
      </div>

      {/* Bottom Right Corner Triangles */}
      <div 
        className="absolute bottom-0 right-0 w-0 h-0"
        style={{
          borderRight: '80px solid hsl(142, 76%, 45%)',
          borderTop: '80px solid transparent',
        }}
      />
      <div 
        className="absolute bottom-0 right-16 w-0 h-0"
        style={{
          borderRight: '40px solid hsl(142, 76%, 50%)',
          borderTop: '60px solid transparent',
        }}
      />
      <div 
        className="absolute bottom-8 right-0 w-0 h-0"
        style={{
          borderRight: '50px solid hsl(142, 76%, 55%)',
          borderTop: '40px solid transparent',
        }}
      />

      {/* Logo - Top Right */}
      <div className="absolute top-4 right-20">
        <img src={logo} alt="Pixelora Studio" className="h-10 w-auto" />
      </div>

      {/* Tagline - Top Left */}
      <p className="absolute top-6 left-14 text-sm font-medium italic text-foreground">
        Creative, Together
      </p>

      {/* Main Content Area */}
      <div className="absolute top-16 left-4 right-4 flex">
        {/* Left Side - Text */}
        <div className="flex-1 pt-4 pr-2">
          <h2 
            className="text-2xl font-display font-bold italic"
            style={{ color: 'hsl(142, 76%, 45%)' }}
          >
            HAPPY
          </h2>
          <h1 className="text-3xl font-display font-bold text-foreground -mt-1">
            NEW YEAR
          </h1>
          <p 
            className="text-5xl font-display font-bold mt-1"
            style={{ 
              background: 'linear-gradient(180deg, hsl(142, 76%, 50%) 0%, hsl(142, 76%, 35%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            2026
          </p>

          {/* Sparkle decorations */}
          <div className="absolute top-20 left-2 text-primary opacity-60 text-xs">✦</div>
          <div className="absolute top-32 left-20 text-primary opacity-40 text-xs">✦</div>
        </div>

        {/* Right Side - Photo */}
        <div className="relative w-[140px] h-[140px] mt-2 flex-shrink-0">
          <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-primary">
            {croppedImageUrl ? (
              <img src={croppedImageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-xs">Photo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Name & Designation - Below main content */}
      <div className="absolute top-[220px] left-4">
        <h3 className="text-base font-display font-bold text-foreground uppercase tracking-wide">
          {fullName || "YOUR NAME"}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {designation || "Designation"}
        </p>
      </div>

      {/* Quote Section */}
      <div className="absolute bottom-10 left-4 right-16">
        <div className="relative bg-secondary/50 rounded-lg py-2 px-4">
          <span 
            className="absolute -top-2 left-0 text-xl font-serif leading-none"
            style={{ color: 'hsl(142, 76%, 45%)' }}
          >
            ❝
          </span>
          <span 
            className="absolute -bottom-2 right-0 text-xl font-serif leading-none"
            style={{ color: 'hsl(142, 76%, 45%)' }}
          >
            ❞
          </span>
          <p className="text-xs text-foreground text-center leading-relaxed px-2">
            Wishing you a New Year filled with success, prosperity, and new opportunities. 
            May 2026 be a year of great achievements for all of us. Happy New Year!
          </p>
        </div>
      </div>

      {/* Developer Credit */}
      <div className="absolute bottom-3 left-4">
        <span className="text-xs text-muted-foreground">
          Developed by <span className="font-medium text-foreground">Ataur Rahman</span>
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-center mb-8 animate-fade-in">
          <img src={logo} alt="Pixelora Studio" className="h-12 w-auto" />
        </div>

        {/* Main Card */}
        <div className="bg-card rounded-2xl shadow-card p-6 md:p-8 animate-scale-in">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Preview Section */}
            <div className="flex items-center justify-center">
              <div className="border-2 border-dashed border-border rounded-xl p-4 bg-muted/30">
                {step === 1 && !imgSrc ? (
                  <div className="w-[400px] h-[420px] flex items-center justify-center">
                    <p className="text-muted-foreground text-center">
                      Preview will appear here
                    </p>
                  </div>
                ) : step === 1 && imgSrc ? (
                  <div className="max-w-[320px]">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={1}
                      circularCrop
                    >
                      <img
                        ref={imgRef}
                        alt="Upload"
                        src={imgSrc}
                        onLoad={onImageLoad}
                        className="max-w-full max-h-[320px] rounded-lg"
                      />
                    </ReactCrop>
                  </div>
                ) : (
                  renderPreview()
                )}
              </div>
            </div>

            {/* Form Section */}
            <div className="flex flex-col">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Frame Editor
              </h1>
              <p className="text-muted-foreground mb-6">
                {step === 1 && 'Step 1: Upload Photo'}
                {step === 2 && 'Step 2: Add Your Details'}
                {step === 3 && 'Step 3: Download Your Frame'}
              </p>

              {/* Step 1: Upload */}
              {step === 1 && (
                <div className="space-y-6 flex-1">
                  <div>
                    <Label className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 block">
                      1. Select Photo
                    </Label>
                    <div className="relative">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onSelectFile}
                        className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-medium file:cursor-pointer hover:file:bg-primary/90 transition-colors"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={!imgSrc}
                    className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base shadow-soft hover:shadow-glow transition-all duration-300"
                  >
                    Next: Crop & Preview
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <div className="space-y-6 flex-1">
                  <div>
                    <Label className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 block">
                      2. Full Name
                    </Label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="py-6 text-base"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 block">
                      3. Designation
                    </Label>
                    <Input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Enter your designation"
                      className="py-6 text-base"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 py-6 text-base"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex-1 gradient-primary text-primary-foreground font-semibold py-6 text-base shadow-soft hover:shadow-glow transition-all duration-300"
                    >
                      Preview
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Download */}
              {step === 3 && (
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  <p className="text-muted-foreground text-center">
                    Your photo frame is ready! Click below to download.
                  </p>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 py-6 text-base"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Back
                    </Button>
                    <Button
                      onClick={handleDownload}
                      className="flex-1 gradient-primary text-primary-foreground font-semibold py-6 text-base shadow-soft hover:shadow-glow transition-all duration-300"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download PNG
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={handleStartOver}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Start Over
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-6">
          © {new Date().getFullYear()} Pixelora Studio. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default FrameEditor;
