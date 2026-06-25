export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t py-4 px-6">
      <div className="flex items-center justify-center">
        <p className="text-muted-foreground text-sm text-center">
          Phòng khám Hữu Nghĩa &copy; {currentYear} Nha Trang, Việt Nam
        </p>
      </div>
    </footer>
  )
}
