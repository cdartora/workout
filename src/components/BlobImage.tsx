import { useEffect, useRef, type ImgHTMLAttributes } from 'react'

/** <img> para um Blob do banco; a URL temporária é revogada ao trocar ou desmontar. */
export function BlobImage({ blob, ...props }: { blob: Blob } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>) {
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const url = URL.createObjectURL(blob)
    ref.current!.src = url
    return () => URL.revokeObjectURL(url)
  }, [blob])
  return <img ref={ref} {...props} />
}
