import Image from "next/image";

export default function AboutPortrait() {
  return (
    <div
      data-scene-frame
      className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface)]"
    >
      {/* Non-semantic wrapper: the About scene clips/scales this, never the frame or the caption. */}
      <div data-scene-iris className="absolute inset-0">
        <Image
          src="/images/Profile.JPEG"
          alt="Portrait"
          fill
          className="object-cover scale-200"
          objectPosition="center -50%"
          priority
        />
      </div>
      <div
        data-scene-caption
        className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[var(--hairline)] bg-background/60 px-5 py-4 backdrop-blur-md"
      >
        <span className="text-sm font-medium text-foreground">Hafidz</span>
        <span className="text-xs text-muted-foreground">Semarang, ID</span>
      </div>
    </div>
  );
}
