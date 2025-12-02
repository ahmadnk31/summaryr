import Image from "next/image"

export function DashboardPreview() {
  return (
    <div className="w-full">
      <Image
        src="/dashboard-preview.png"
        alt="Dashboard preview"
        width={1160}
        height={700}
        className="w-full h-auto object-contain rounded-xl"
        priority
        quality={85}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1160px"
      />
    </div>
  )
}
