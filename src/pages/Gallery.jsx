import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import "./Gallery.css";

const API_BASE = "";

// ===== SIDEBAR (ESTERNA) =====

function Sidebar({
  data,
  openCategory,
  toggleSidebarCategory,
  isActiveCategory,
  isActiveSub,
  isActiveSection,
  goHome,
  goToSub,
  goToSection,
  getChildKeys,
  styles,
}) {
  if (!data) return null;

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoWrapper}>
        <img
          src="/logo.webp"
          alt="Museo Logo"
          style={styles.logo}
          onClick={goHome}
        />
      </div>

      {Object.keys(data).map((cat) => {
        const subCats = Object.keys(data[cat] || {});
        const isOpen = openCategory === cat;
        const isActive = isActiveCategory(cat);

        return (
          <div key={cat} style={styles.catBlock}>
            <div
              className="gallery-touch-button gallery-accordion-trigger"
              onClick={() => toggleSidebarCategory(cat)}
              style={{
                ...styles.catItem,
                background: isOpen
                  ? "rgba(255,255,255,0.16)"
                  : "rgba(255,255,255,0.07)",
                borderLeft: isActive
                  ? "4px solid #00d5ef"
                  : "4px solid transparent",
              }}
            >
              <span style={styles.catLabel}>{cat}</span>
              <span
                className={
                  isOpen
                    ? "gallery-accordion-arrow open"
                    : "gallery-accordion-arrow"
                }
                style={styles.accordionArrow}
              >
                ›
              </span>
            </div>

            <div
              className={isOpen ? "gallery-sublist open" : "gallery-sublist"}
              style={{
                ...styles.subList,
                maxHeight: isOpen ? "70vh" : 0,
              }}
            >
              {subCats.map((s) => {
                const sectionKeys = getChildKeys(data?.[cat]?.[s]);

                return (
                  <div key={s}>
                    <div
                      className="gallery-touch-button"
                      onClick={() => goToSub(cat, s)}
                      style={{
                        ...styles.subItem,
                        background: isActiveSub(cat, s)
                          ? "rgba(255,255,255,0.24)"
                          : "transparent",
                        borderLeft: isActiveSub(cat, s)
                          ? "4px solid #00d5ef"
                          : "4px solid transparent",
                      }}
                    >
                      {s}
                    </div>

                    {isActiveSub(cat, s) && sectionKeys.length > 0 && (
                      <div style={styles.sectionList}>
                        {sectionKeys.map((sec) => (
                          <div
                            key={sec}
                            className="gallery-touch-button"
                            onClick={() => goToSection(cat, s, sec)}
                            style={{
                              ...styles.sectionItem,
                              background: isActiveSection(cat, s, sec)
                                ? "rgba(255,255,255,0.22)"
                                : "transparent",
                              borderLeft: isActiveSection(cat, s, sec)
                                ? "4px solid #00d5ef"
                                : "4px solid transparent",
                            }}
                          >
                            {sec}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Gallery() {
  const { category, sub, section } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [openCategory, setOpenCategory] = useState(null);
  const [viewerDirection, setViewerDirection] = useState("next");
  const [viewerAnimationKey, setViewerAnimationKey] = useState(0);
  const [isDraggingViewer, setIsDraggingViewer] = useState(false);
  const [viewerDragX, setViewerDragX] = useState(0);
  const [viewerSwipeClass, setViewerSwipeClass] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [pendingOpenFileSrc, setPendingOpenFileSrc] = useState(null);

  const keyboardRef = useRef(null);
  const searchInputRef = useRef(null);

  const homeScrollRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const subScrollRef = useRef(null);
  const sectionScrollRef = useRef(null);
  const searchScrollRef = useRef(null);

  const swipeStartRef = useRef({
    x: 0,
    y: 0,
    active: false,
    pointerId: null,
  });

  const ignoreViewerClickRef = useRef(false);

  const norm = (s) => decodeURIComponent(s || "").trim().toLowerCase();

  const findKey = (obj, key) =>
    Object.keys(obj || {}).find((k) => norm(k) === norm(key));

  const getFileNameWithoutExtension = (src) => {
  const fileName = src?.split("/").pop() || "";
  const decodedName = decodeURIComponent(fileName);
  return decodedName.replace(/\.[^/.]+$/, "");
};

    const getFileExtension = (src) => {
    const fileName = src?.split("/").pop() || "";
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  };

  const getFileKind = (file) => {
    const type = file?.type?.toLowerCase() || "";
    const ext = getFileExtension(file?.src);

    if (
      type === "image" ||
      ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)
    ) {
      return "image";
    }

    if (
      type === "audio" ||
      ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)
    ) {
      return "audio";
    }

    if (type === "pdf" || ext === "pdf") {
      return "pdf";
    }

    return type || "file";
  };

  const getFileIcon = (file) => {
    const kind = getFileKind(file);

    if (kind === "audio") return "♪";
    if (kind === "pdf") return "PDF";
    return "FILE";
  };

  const getFileTypeLabel = (file) => {
    const kind = getFileKind(file);

    if (kind === "image") return "Immagine";
    if (kind === "audio") return "Audio";
    if (kind === "pdf") return "PDF";

    return "File";
  };

  const getChildKeys = (obj) =>
    Object.keys(obj || {}).filter((key) => key !== "files");

  const findFirstImageInNode = (node) => {
    if (!node) return null;

    const directImage = node.files?.find((file) => getFileKind(file) === "image");

    if (directImage) return directImage;

    const childKeys = getChildKeys(node);

    for (const key of childKeys) {
      const found = findFirstImageInNode(node[key]);
      if (found) return found;
    }

    return null;
  };

  const buildSearchItems = (galleryData) => {
    const results = [];

    Object.keys(galleryData || {}).forEach((cat) => {
      const catNode = galleryData[cat];

      results.push({
        kind: "category",
        title: cat,
        subtitle: "Categoria",
        cat,
        searchableText: `${cat} categoria`,
      });

      Object.keys(catNode || {})
        .filter((key) => key !== "files")
        .forEach((subCat) => {
          const subNode = catNode[subCat];

          results.push({
            kind: "sub",
            title: subCat,
            subtitle: cat,
            cat,
            sub: subCat,
            searchableText: `${cat} ${subCat} sottocategoria`,
          });

          const subFiles = subNode?.files || [];

          subFiles.forEach((file) => {
            const fileTitle = getFileNameWithoutExtension(file.src);

            results.push({
              kind: "file",
              title: fileTitle,
              subtitle: `${cat} / ${subCat} · ${getFileTypeLabel(file)}`,
              cat,
              sub: subCat,
              section: null,
              fileSrc: file.src,
              file,
              searchableText: `${cat} ${subCat} ${fileTitle} ${getFileTypeLabel(
                file
              )}`,
            });
          });

          Object.keys(subNode || {})
            .filter((key) => key !== "files")
            .forEach((sec) => {
              const sectionNode = subNode[sec];

              results.push({
                kind: "section",
                title: sec,
                subtitle: `${cat} / ${subCat}`,
                cat,
                sub: subCat,
                section: sec,
                searchableText: `${cat} ${subCat} ${sec} sezione`,
              });

              const sectionFiles = sectionNode?.files || [];

              sectionFiles.forEach((file) => {
                const fileTitle = getFileNameWithoutExtension(file.src);

                results.push({
                  kind: "file",
                  title: fileTitle,
                  subtitle: `${cat} / ${subCat} / ${sec} · ${getFileTypeLabel(
                    file
                  )}`,
                  cat,
                  sub: subCat,
                  section: sec,
                  fileSrc: file.src,
                  file,
                  searchableText: `${cat} ${subCat} ${sec} ${fileTitle} ${getFileTypeLabel(
                    file
                  )}`,
                });
              });
            });
        });
    });

    return results;
  };

  const scrollToTop = (ref) => {
    if (!ref?.current) return;

    ref.current.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const BackToTopButton = ({ targetRef }) => (
    <button
      className="gallery-touch-button"
      style={styles.backToTopButton}
      onClick={() => scrollToTop(targetRef)}
    >
      Torna in cima ↑
    </button>
  );

  const isActiveCategory = (cat) => norm(category) === norm(cat);

  const isActiveSub = (cat, subCat) =>
    norm(category) === norm(cat) && norm(sub) === norm(subCat);

  const isActiveSection = (cat, subCat, sectionCat) =>
    norm(category) === norm(cat) &&
    norm(sub) === norm(subCat) &&
    norm(section) === norm(sectionCat);

  useEffect(() => {
    setSelectedIndex(null);
    resetViewerDrag();
  }, [category, sub, section]);

  useEffect(() => {
    fetch(`${API_BASE}/api/gallery`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

    useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        keyboardRef.current &&
        !keyboardRef.current.contains(e.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target)
      ) {
        setIsKeyboardOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  const categoryKey = data && category ? findKey(data, category) : null;
  const categoryData = categoryKey ? data[categoryKey] : null;

  const subKey = categoryData && sub ? findKey(categoryData, sub) : null;
  const subData = categoryData && subKey ? categoryData[subKey] : null;

  const sectionKey = subData && section ? findKey(subData, section) : null;
  const sectionData = subData && sectionKey ? subData[sectionKey] : null;

  const currentData = section ? sectionData : subData;

  const files = currentData?.files || [];
  const images = files.filter((f) => getFileKind(f) === "image");
  const selectedFile = selectedIndex !== null ? files[selectedIndex] : null;
  const selectedFileKind = selectedFile ? getFileKind(selectedFile) : null;

  const searchItems = useMemo(() => {
    return data ? buildSearchItems(data) : [];
  }, [data]);

  const filteredSearchItems = useMemo(() => {
    const q = norm(searchQuery);

    if (!q) return [];

    return searchItems
      .filter((item) => norm(item.searchableText).includes(q))
      .slice(0, 80);
  }, [searchItems, searchQuery]);

  const isSearchActive = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!pendingOpenFileSrc) return;

    const fileIndex = files.findIndex(
      (file) => file.src === pendingOpenFileSrc
    );

    if (fileIndex >= 0) {
      openFile(fileIndex);
      setPendingOpenFileSrc(null);
    }
  }, [pendingOpenFileSrc, files]);

  if (!data) return <div style={styles.loading}>Caricamento...</div>;

  const getSubPreviewImage = (cat, subCat) => {
    const currentSubData = data?.[cat]?.[subCat];
    const firstImage = findFirstImageInNode(currentSubData);

    return firstImage ? `${API_BASE}${firstImage.src}` : null;
  };

  const getSectionPreviewImage = (cat, subCat, sectionCat) => {
    const currentSectionData = data?.[cat]?.[subCat]?.[sectionCat];
    const firstImage = findFirstImageInNode(currentSectionData);

    return firstImage ? `${API_BASE}${firstImage.src}` : null;
  };

  const getCurrentImagePosition = () => {
    if (selectedIndex === null || !selectedFile) return -1;

    return images.findIndex(
      (image) => image.src === selectedFile.src
    );
  };

  const getFileIndexBySrc = (src) => {
    return files.findIndex((file) => file.src === src);
  };

  function resetViewerDrag() {
    swipeStartRef.current = {
      x: 0,
      y: 0,
      active: false,
      pointerId: null,
    };

    setIsDraggingViewer(false);
    setViewerDragX(0);
    setViewerSwipeClass("");
  }

  const goHome = () => {
    setOpenCategory(null);
    setSelectedIndex(null);
    resetViewerDrag();
    setSearchQuery("");
    setIsKeyboardOpen(false);
    navigate("/gallery");
  };

  const goToCategory = (cat) => {
    setSelectedIndex(null);
    resetViewerDrag();
    navigate(`/gallery/${encodeURIComponent(cat)}`);
  };

  const goToSub = (cat, s) => {
    setSelectedIndex(null);
    resetViewerDrag();
    navigate(
      `/gallery/${encodeURIComponent(cat)}/${encodeURIComponent(s)}`
    );
  };

  const goToSection = (cat, s, sec) => {
    setSelectedIndex(null);
    resetViewerDrag();
    navigate(
      `/gallery/${encodeURIComponent(cat)}/${encodeURIComponent(
        s
      )}/${encodeURIComponent(sec)}`
    );
  };

  const toggleSidebarCategory = (cat) => {
    setOpenCategory((current) => (current === cat ? null : cat));
  };

    const openFile = (fileIndex) => {
    if (fileIndex >= 0) {
      resetViewerDrag();
      setViewerDirection("next");
      setViewerAnimationKey((current) => current + 1);
      setSelectedIndex(fileIndex);
    }
  };

  const closeViewer = () => {
    setSelectedIndex(null);
    resetViewerDrag();
  };

  const handleViewerBackdropClick = () => {
    if (ignoreViewerClickRef.current) {
      ignoreViewerClickRef.current = false;
      return;
    }

    closeViewer();
  };

  const nextImage = () => {
    const currentImagePosition = getCurrentImagePosition();

    if (currentImagePosition < 0 || images.length <= 1) return;

    const nextImagePosition =
      currentImagePosition + 1 >= images.length
        ? 0
        : currentImagePosition + 1;

    const nextFileIndex = getFileIndexBySrc(
      images[nextImagePosition].src
    );

    if (nextFileIndex >= 0) {
      setViewerDirection("next");
      setSelectedIndex(nextFileIndex);
      setViewerSwipeClass("slide-next");

      setTimeout(() => {
        setViewerSwipeClass("");
      }, 550);
    }
  };

  const prevImage = () => {
    const currentImagePosition = getCurrentImagePosition();

    if (currentImagePosition < 0 || images.length <= 1) return;

    const prevImagePosition =
      currentImagePosition - 1 < 0
        ? images.length - 1
        : currentImagePosition - 1;

    const prevFileIndex = getFileIndexBySrc(
      images[prevImagePosition].src
    );

    if (prevFileIndex >= 0) {
      setViewerDirection("prev");
      setSelectedIndex(prevFileIndex);
      setViewerSwipeClass("slide-prev");

      setTimeout(() => {
        setViewerSwipeClass("");
      }, 550);
    }
  };

  const handleSearchFocus = () => {
    setIsKeyboardOpen(true);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setIsKeyboardOpen(true);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsKeyboardOpen(false);
  };

  const closeKeyboard = () => {
    setIsKeyboardOpen(false);
  };

  const addKeyboardChar = (char) => {
    setSearchQuery((current) => `${current}${char}`);
  };

  const removeKeyboardChar = () => {
    setSearchQuery((current) => current.slice(0, -1));
  };

  const handleSearchResultClick = (item) => {
    setSelectedIndex(null);
    resetViewerDrag();
    setIsKeyboardOpen(false);
    setSearchQuery("");

    if (item.cat) {
      setOpenCategory(item.cat);
    }

    if (item.kind === "category") {
      goToCategory(item.cat);
      return;
    }

    if (item.kind === "sub") {
      goToSub(item.cat, item.sub);
      return;
    }

    if (item.kind === "section") {
      goToSection(item.cat, item.sub, item.section);
      return;
    }

    if (item.kind === "file") {
      if (item.section) {
        goToSection(item.cat, item.sub, item.section);
      } else {
        goToSub(item.cat, item.sub);
      }

      setPendingOpenFileSrc(item.fileSrc);
    }
  };

  // ===== TOUCH HANDLERS VIEWER =====

  const onPointerDownViewer = (e) => {
    if (selectedFileKind !== "image" || images.length <= 1) return;

    e.stopPropagation();

    swipeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      active: true,
      pointerId: e.pointerId,
    };

    ignoreViewerClickRef.current = false;
    setIsDraggingViewer(true);
    setViewerDragX(0);
    setViewerSwipeClass("");

    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

    const onPointerMoveViewer = (e) => {
    if (!swipeStartRef.current.active) return;
    if (swipeStartRef.current.pointerId !== e.pointerId) return;

    e.stopPropagation();

    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;

    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      ignoreViewerClickRef.current = true;
    }

    setViewerDragX(dx);
  };

  const onPointerUpViewer = (e) => {
    if (!swipeStartRef.current.active) return;
    if (swipeStartRef.current.pointerId !== e.pointerId) return;

    e.stopPropagation();

    const dx = e.clientX - swipeStartRef.current.x;
    const threshold = 80;

    swipeStartRef.current.active = false;
    setIsDraggingViewer(false);

    if (e.currentTarget.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }

    if (Math.abs(dx) > threshold) {
      ignoreViewerClickRef.current = true;

      if (dx < 0) {
        setViewerSwipeClass("swipe-exit-left");

        setTimeout(() => {
          nextImage();
          setViewerDragX(0);
        }, 180);
      } else {
        setViewerSwipeClass("swipe-exit-right");

        setTimeout(() => {
          prevImage();
          setViewerDragX(0);
        }, 180);
      }

      return;
    }

    setViewerSwipeClass("swipe-reset");
    setViewerDragX(0);

    setTimeout(() => {
      setViewerSwipeClass("");
    }, 280);
  };

  const onPointerCancelViewer = (e) => {
    e.stopPropagation();
    ignoreViewerClickRef.current = true;
    resetViewerDrag();
  };

  // ===== SEARCH BAR + RISULTATI =====

  const SearchBar = () => (
    <div style={styles.searchWrapper}>
      <input
        ref={searchInputRef}
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        onFocus={handleSearchFocus}
        placeholder="Cerca contenuti..."
        style={styles.searchInput}
      />

      {searchQuery && (
        <button style={styles.searchClear} onClick={clearSearch}>
          ✕
        </button>
      )}
    </div>
  );

  const SearchResults = () => {
    if (!isSearchActive) return null;

    return (
      <div ref={searchScrollRef} style={styles.searchResults}>
        {filteredSearchItems.length === 0 && (
          <div style={styles.noResults}>Nessun risultato</div>
        )}

        {filteredSearchItems.map((item, index) => (
          <div
            key={`${item.kind}-${index}`}
            style={styles.searchItem}
            className="gallery-touch-button"
            onClick={() => handleSearchResultClick(item)}
          >
            <div style={styles.searchTitle}>{item.title}</div>
            <div style={styles.searchSubtitle}>{item.subtitle}</div>
          </div>
        ))}

        <BackToTopButton targetRef={searchScrollRef} />
      </div>
    );
  };

  // ===== TASTIERA TOUCH =====

  const Keyboard = () => {
    if (!isKeyboardOpen) return null;

    const rows = [
      "QWERTYUIOP",
      "ASDFGHJKL",
      "ZXCVBNM",
      "SPACE_ROW",
    ];

    return (
      <div
        ref={keyboardRef}
        style={styles.keyboard}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {rows.map((row, i) => {
          if (row === "SPACE_ROW") {
            return (
              <div key={i} style={styles.keyboardRow}>
                <button
                  style={styles.keyWide}
                  onClick={() => addKeyboardChar(" ")}
                >
                  spazio
                </button>
              </div>
            );
          }

          return (
            <div key={i} style={styles.keyboardRow}>
              {row.split("").map((char) => (
                <button
                  key={char}
                  style={styles.key}
                  onClick={() => addKeyboardChar(char.toLowerCase())}
                >
                  {char}
                </button>
              ))}
            </div>
          );
        })}

        <div style={styles.keyboardRow}>
          <button style={styles.keyWide} onClick={removeKeyboardChar}>
            ⌫
          </button>
          <button style={styles.keyWide} onClick={closeKeyboard}>
            OK
          </button>
        </div>
      </div>
    );
  };

    // ===== HOME =====

  const HomeView = () => (
    <div ref={homeScrollRef} style={styles.homePage}>
      <img src="/logo.webp" alt="Museo Logo" style={styles.homeLogo} />

      <SearchBar />
      <SearchResults />

      {!isSearchActive && (
        <div style={styles.homeGrid}>
          {Object.keys(data).map((cat) => (
            <div
              key={cat}
              className="gallery-touch-card gallery-home-card"
              style={styles.homeCard}
              onClick={() => goToCategory(cat)}
            >
              {cat}
            </div>
          ))}

          <BackToTopButton targetRef={homeScrollRef} />
        </div>
      )}
    </div>
  );

  // ===== CATEGORY =====

  const CategoryView = () => {
    const subCats = Object.keys(categoryData || {});

    return (
      <div style={styles.categoryPage}>
        <SearchBar />
        <SearchResults />

        {!isSearchActive && (
          <>
            <div style={styles.categoryHeader}>
              {categoryKey || "Categoria non trovata"}
            </div>

            <div ref={categoryScrollRef} style={styles.categoryGrid}>
              {subCats.map((s) => {
                const previewImage = getSubPreviewImage(categoryKey, s);

                return (
                  <div
                    key={s}
                    className="gallery-touch-card gallery-subcat-card"
                    style={styles.subCatCard}
                    onClick={() => goToSub(categoryKey, s)}
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={s}
                        style={styles.subCatPreview}
                        draggable={false}
                      />
                    ) : (
                      <div style={styles.subCatPlaceholder}>
                        Nessuna immagine
                      </div>
                    )}

                    <div style={styles.subCatTitle}>{s}</div>
                  </div>
                );
              })}

              <BackToTopButton targetRef={categoryScrollRef} />
            </div>
          </>
        )}
      </div>
    );
  };

  // ===== SECTION VIEW =====

  const SectionView = () => {
    if (!sectionData) return null;

    const sectionFiles = sectionData.files || [];

    return (
      <div style={styles.subPage}>
        <SearchBar />
        <SearchResults />

        {!isSearchActive && (
          <>
            <div style={styles.subHeader}>{sectionKey}</div>

            <div ref={sectionScrollRef} style={styles.subScroll}>
              <div style={styles.grid}>
                {sectionFiles.map((file, i) => (
                  <FileCard
                    key={`${file.src || file.type}-${i}`}
                    file={file}
                    index={i}
                  />
                ))}

                <BackToTopButton targetRef={sectionScrollRef} />
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ===== FILE CARD =====

  const FileCard = ({ file, index }) => {
    const kind = getFileKind(file);
    const url = `${API_BASE}${file.src}`;
    const title = getFileNameWithoutExtension(file.src);

    if (kind === "image") {
      return (
        <img
          key={`${file.src}-${index}`}
          className="gallery-touch-card gallery-image-card"
          src={url}
          alt={title}
          onClick={() => openFile(index)}
          style={styles.image}
          draggable={false}
        />
      );
    }

    return (
      <div
        key={`${file.src || file.type}-${index}`}
        className="gallery-touch-card gallery-media-card"
        style={styles.mediaCard}
        onClick={() => openFile(index)}
      >
        <div style={styles.mediaIcon}>{getFileIcon(file)}</div>
        <div style={styles.mediaTitle}>{title}</div>
        <div style={styles.mediaType}>
          {kind === "audio" ? "Audio" : kind === "pdf" ? "PDF" : "File"}
        </div>
      </div>
    );
  };

    // ===== VIEWER CONTENT =====

  const ViewerContent = () => {
    if (!selectedFile) return null;

    const url = `${API_BASE}${selectedFile.src}`;
    const title = getFileNameWithoutExtension(selectedFile.src);

    if (selectedFileKind === "image") {
      return (
        <div
          style={styles.viewerImageFrame}
          onPointerDown={onPointerDownViewer}
          onPointerMove={onPointerMoveViewer}
          onPointerUp={onPointerUpViewer}
          onPointerCancel={onPointerCancelViewer}
        >
          <img
            className={[
              "gallery-viewer-image",
              isDraggingViewer ? "dragging" : "",
              viewerSwipeClass,
            ]
              .filter(Boolean)
              .join(" ")}
            src={url}
            alt={title}
            style={{
              ...styles.viewerImg,
              transform:
                isDraggingViewer && viewerDragX !== 0
                  ? `translateX(${viewerDragX}px) scale(0.98)`
                  : undefined,
            }}
            draggable={false}
          />
        </div>
      );
    }

    if (selectedFileKind === "audio") {
      return (
        <div
          className="gallery-viewer-content-enter"
          style={styles.audioViewer}
        >
          <div style={styles.audioIcon}>♪</div>
          <div style={styles.audioTitle}>{title}</div>

          <audio controls style={styles.audioPlayer}>
            <source src={url} />
            Il tuo browser non supporta la riproduzione audio.
          </audio>
        </div>
      );
    }

    if (selectedFileKind === "pdf") {
      return (
        <div
          className="gallery-viewer-content-enter"
          style={styles.pdfViewerWrapper}
        >
          <iframe src={url} title={title} style={styles.pdfViewer} />
        </div>
      );
    }

    return (
      <div
        className="gallery-viewer-content-enter"
        style={styles.unsupportedViewer}
      >
        <div style={styles.mediaIcon}>FILE</div>
        <div style={styles.audioTitle}>{title}</div>
        <div style={styles.unsupportedText}>
          Questo tipo di file non è ancora visualizzabile.
        </div>
      </div>
    );
  };

  // ===== VIEWER OVERLAY =====

  const ViewerOverlay = () => {
    if (selectedIndex === null || !selectedFile) return null;

    return (
      <div
        className="gallery-viewer-backdrop gallery-viewer-stable"
        style={styles.viewer}
        onClick={handleViewerBackdropClick}
      >
        <button
          className="gallery-viewer-button gallery-close-button"
          style={styles.close}
          onClick={(e) => {
            e.stopPropagation();
            closeViewer();
          }}
        >
          ✕
        </button>

        {selectedFileKind === "image" && images.length > 1 && (
          <button
            className="gallery-viewer-button gallery-arrow-button"
            style={styles.left}
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            aria-label="Immagine precedente"
          >
            <span style={styles.arrowIcon}>‹</span>
          </button>
        )}

        <div
          className="gallery-viewer-box-stable"
          style={{
            ...styles.viewerBox,
            ...(selectedFileKind === "image" ? styles.viewerBoxImage : null),
            ...(selectedFileKind === "pdf" ? styles.viewerBoxPdf : null),
            ...(selectedFileKind === "audio" ? styles.viewerBoxAudio : null),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.viewerHeader}>
            {getFileNameWithoutExtension(selectedFile.src)}
          </div>

          <div
            style={{
              ...styles.viewerContent,
              ...(selectedFileKind === "image"
                ? styles.viewerContentImage
                : null),
              ...(selectedFileKind === "pdf" ? styles.viewerContentPdf : null),
            }}
          >
            <ViewerContent />
          </div>
        </div>

        {selectedFileKind === "image" && images.length > 1 && (
          <button
            className="gallery-viewer-button gallery-arrow-button"
            style={styles.right}
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            aria-label="Immagine successiva"
          >
            <span style={styles.arrowIcon}>›</span>
          </button>
        )}
      </div>
    );
  };

  // ===== SUB VIEW =====

  const SubView = () => {
    const sectionKeys = getChildKeys(subData);

    return (
      <div style={styles.subPage}>
        <SearchBar />
        <SearchResults />

        {!isSearchActive && (
          <>
            <div style={styles.subHeader}>{subKey}</div>

            {sectionKeys.length > 0 && (
              <div ref={sectionScrollRef} style={styles.sectionGrid}>
                {sectionKeys.map((sec) => {
                  const previewImage = getSectionPreviewImage(
                    categoryKey,
                    subKey,
                    sec
                  );

                  return (
                    <div
                      key={sec}
                      className="gallery-touch-card"
                      style={styles.sectionCard}
                      onClick={() => goToSection(categoryKey, subKey, sec)}
                    >
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt={sec}
                          style={styles.sectionCardPreview}
                          draggable={false}
                        />
                      ) : (
                        <div style={styles.sectionCardPlaceholder}>
                          Nessuna immagine
                        </div>
                      )}

                      <div style={styles.sectionCardTitle}>{sec}</div>
                    </div>
                  );
                })}

                <BackToTopButton targetRef={sectionScrollRef} />
              </div>
            )}

            {files.length > 0 && (
              <div ref={subScrollRef} style={styles.subScroll}>
                <div style={styles.grid}>
                  {files.map((file, i) => (
                    <FileCard
                      key={`${file.src || file.type}-${i}`}
                      file={file}
                      index={i}
                    />
                  ))}

                  <BackToTopButton targetRef={subScrollRef} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ===== RENDER =====

  return (
    <div style={styles.app}>
      <Sidebar
        data={data}
        openCategory={openCategory}
        toggleSidebarCategory={toggleSidebarCategory}
        isActiveCategory={isActiveCategory}
        isActiveSub={isActiveSub}
        isActiveSection={isActiveSection}
        goHome={goHome}
        goToSub={goToSub}
        goToSection={goToSection}
        getChildKeys={getChildKeys}
        styles={styles}
      />

      <div style={styles.main}>
        {!category ? (
          <HomeView />
        ) : !sub ? (
          <CategoryView />
        ) : section ? (
          <SectionView />
        ) : (
          <SubView />
        )}
      </div>

      <Keyboard />
      <ViewerOverlay />
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    background: "linear-gradient(135deg, #056689, #023b4f)",
    color: "#fff",
    fontFamily: "'Barlow Condensed', sans-serif",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    userSelect: "none",
  },

  loading: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #056689, #023b4f)",
    color: "#fff",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 28,
  },

  sidebar: {
    width: 290,
    flexShrink: 0,
    background: "rgba(0,0,0,0.28)",
    backdropFilter: "blur(12px)",
    padding: 18,
    overflowY: "auto",
    overflowX: "hidden",
    borderRight: "1px solid rgba(255,255,255,0.13)",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    textAlign: "left",
    boxShadow: "12px 0 35px rgba(0,0,0,0.18)",
  },

  logoWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    padding: "18px 0",
    marginBottom: 18,
  },

  logo: {
    width: 118,
    height: "auto",
    objectFit: "contain",
    display: "block",
    margin: "0 auto",
    pointerEvents: "auto",
    cursor: "pointer",
  },

  catBlock: {
    marginBottom: 10,
  },

  catItem: {
    minHeight: 58,
    width: "100%",
    boxSizing: "border-box",
    textAlign: "left",
    padding: "14px 12px",
    cursor: "pointer",
    borderRadius: 14,
    fontSize: 21,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  catLabel: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  accordionArrow: {
    flexShrink: 0,
    fontSize: 34,
    lineHeight: 1,
    opacity: 0.85,
  },

  subList: {
    overflow: "hidden",
    marginLeft: 10,
    paddingTop: 6,
  },

  subItem: {
    minHeight: 50,
    padding: "10px 10px",
    marginTop: 6,
    cursor: "pointer",
    width: "100%",
    boxSizing: "border-box",
    textAlign: "left",
    borderRadius: 12,
    fontSize: 19,
    display: "flex",
    alignItems: "center",
    color: "rgba(255,255,255,0.84)",
  },

  sectionList: {
    marginLeft: 18,
    marginTop: 4,
  },

  sectionItem: {
    minHeight: 44,
    padding: "8px 10px",
    marginTop: 4,
    cursor: "pointer",
    borderRadius: 10,
    fontSize: 17,
    display: "flex",
    alignItems: "center",
    color: "rgba(255,255,255,0.75)",
  },

  main: {
    flex: 1,
    minWidth: 0,
    height: "100vh",
    overflow: "hidden",
    padding: 26,
    boxSizing: "border-box",
  },

  searchWrapper: {
    width: "100%",
    maxWidth: 980,
    minHeight: 64,
    marginBottom: 22,
    position: "relative",
    flexShrink: 0,
  },

  searchInput: {
    width: "100%",
    height: 64,
    padding: "0 72px 0 22px",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.13)",
    color: "#fff",
    fontSize: 26,
    fontFamily: "'Barlow Condensed', sans-serif",
    boxSizing: "border-box",
    outline: "none",
  },

  searchClear: {
    position: "absolute",
    right: 10,
    top: 8,
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.14)",
    color: "#fff",
    fontSize: 24,
    cursor: "pointer",
  },

  searchResults: {
    width: "100%",
    maxWidth: 1100,
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 14,
    paddingRight: 8,
    paddingBottom: 180,
    boxSizing: "border-box",
  },

  searchItem: {
    minHeight: 108,
    padding: 18,
    borderRadius: 18,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
    boxSizing: "border-box",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  searchTitle: {
    fontSize: 25,
    lineHeight: 1.05,
    color: "#fff",
  },

  searchSubtitle: {
    marginTop: 8,
    fontSize: 17,
    lineHeight: 1.1,
    color: "rgba(255,255,255,0.7)",
  },

  noResults: {
    minHeight: 120,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.75)",
    fontSize: 24,
  },

  keyboard: {
    position: "fixed",
    left: 320,
    right: 26,
    bottom: 18,
    zIndex: 9000,
    padding: 12,
    borderRadius: 22,
    background: "rgba(0,0,0,0.58)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "0 18px 55px rgba(0,0,0,0.38)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  keyboardRow: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },

  key: {
    flex: "1 1 0",
    maxWidth: 64,
    height: "clamp(42px, 5.5vh, 58px)",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.14)",
    color: "#fff",
    fontSize: "clamp(18px, 2vw, 24px)",
    fontFamily: "'Barlow Condensed', sans-serif",
    cursor: "pointer",
  },

  keyWide: {
    flex: 1,
    maxWidth: 400,
    height: "clamp(42px, 5.5vh, 58px)",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.18)",
    color: "#fff",
    fontSize: "clamp(16px, 2vw, 22px)",
    fontFamily: "'Barlow Condensed', sans-serif",
    cursor: "pointer",
  },

    homePage: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
    padding: "20px 0 40px",
    boxSizing: "border-box",
    overflowY: "auto",
    overflowX: "hidden",
    WebkitOverflowScrolling: "touch",
  },

  homeLogo: {
    width: "clamp(120px, 14vw, 220px)",
    maxHeight: "22vh",
    height: "auto",
    objectFit: "contain",
    pointerEvents: "none",
    flexShrink: 0,
  },

  homeGrid: {
    width: "100%",
    maxWidth: 1050,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
  },

  homeCard: {
    minHeight: 120,
    padding: "20px 22px",
    borderRadius: 22,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 18px 38px rgba(0,0,0,0.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 29,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
  },

  categoryPage: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },

  categoryHeader: {
    padding: "8px 0 22px",
    fontSize: 42,
    fontWeight: 700,
    flexShrink: 0,
  },

  categoryGrid: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: 22,
    paddingRight: 8,
    paddingBottom: 24,
  },

  subCatCard: {
    height: 260,
    borderRadius: 22,
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 18px 38px rgba(0,0,0,0.16)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
  },

  subCatPreview: {
    width: "100%",
    height: 185,
    objectFit: "cover",
    display: "block",
    flexShrink: 0,
    pointerEvents: "none",
  },

  subCatPlaceholder: {
    width: "100%",
    height: 185,
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
    textAlign: "center",
    flexShrink: 0,
  },

  subCatTitle: {
    flex: 1,
    minHeight: 0,
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#fff",
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.1,
  },

  subPage: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },

  subHeader: {
    padding: "8px 0 18px",
    fontSize: 40,
    fontWeight: 700,
    flexShrink: 0,
  },

  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 18,
    marginBottom: 20,
    overflowY: "auto",
    paddingRight: 8,
  },

  sectionCard: {
    minHeight: 190,
    borderRadius: 18,
    background: "rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.16)",
  },

  sectionCardPreview: {
    width: "100%",
    height: 130,
    objectFit: "cover",
    pointerEvents: "none",
    flexShrink: 0,
  },

  sectionCardPlaceholder: {
    width: "100%",
    height: 130,
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },

  sectionCardTitle: {
    flex: 1,
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    textAlign: "center",
  },

  subScroll: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingRight: 8,
    paddingBottom: 24,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 18,
  },

  image: {
    width: "100%",
    aspectRatio: "1/1",
    objectFit: "cover",
    borderRadius: 18,
    cursor: "pointer",
  },

  mediaCard: {
    minHeight: 210,
    padding: 20,
    borderRadius: 22,
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    textAlign: "center",
  },

  mediaIcon: {
    fontSize: 30,
    marginBottom: 10,
  },

  mediaTitle: {
    fontSize: 22,
    fontWeight: 600,
  },

  mediaType: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
  },

  viewer: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },

  viewerBox: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "86vw",
    maxHeight: "86vh",
    background: "rgba(0,0,0,0.26)",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
  },

  viewerBoxImage: {
  width: "min(82vw, 1100px)",
  height: "82vh",
  maxWidth: "82vw",
  maxHeight: "82vh",
},

  viewerBoxPdf: {
  width: "78vw",
  height: "78vh",
  maxWidth: "78vw",
  maxHeight: "78vh",
},

  viewerBoxAudio: {
    width: "70vw",
    maxWidth: 760,
  },

  viewerHeader: {
    flexShrink: 0,
    width: "100%",
    padding: "12px 18px",
    background: "rgba(0,0,0,0.64)",
    backdropFilter: "blur(10px)",
    fontSize: 20,
    fontWeight: 600,
    textAlign: "center",
  },

  viewerContent: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  viewerImg: {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "contain",
  pointerEvents: "none",
},

  close: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 72,
    height: 72,
    borderRadius: "50%",
    fontSize: 30,
    cursor: "pointer",
  },

  backToTopButton: {
    minHeight: 82,
    padding: "18px 24px",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.14)",
    color: "#fff",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 26,
    cursor: "pointer",
    gridColumn: "1 / -1",
  },
  pdfViewerWrapper: {
  width: "100%",
  height: "100%",
  minHeight: 0,
  display: "flex",
  flex: 1,
  background: "#fff",
  overflow: "hidden",
},

pdfViewer: {
  width: "100%",
  height: "100%",
  minHeight: "100%",
  border: "none",
  flex: "1 1 auto",
  display: "block",
  background: "#fff",
},

viewerContentPdf: {
  flex: 1,
  minHeight: 0,
  width: "100%",
  height: "100%",
  padding: 0,
  display: "flex",
  overflow: "hidden",
},

viewerImageFrame: {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden", // OK
  touchAction: "pan-y",
},

viewerContentImage: {
  flex: 1,
  minHeight: 0,
  width: "100%",
  height: "calc(100% - 52px)",
  padding: 18,
  boxSizing: "border-box",
  overflow: "hidden",
},

left: {
  position: "absolute",
  left: 20,
  top: "50%",
  transform: "translateY(-50%)",
  width: 88,
  height: 88,
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.22)",
  borderRadius: "50%",
  color: "white",
  cursor: "pointer",
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
},

right: {
  position: "absolute",
  right: 20,
  top: "50%",
  transform: "translateY(-50%)",
  width: 88,
  height: 88,
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.22)",
  borderRadius: "50%",
  color: "white",
  cursor: "pointer",
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
},

arrowIcon: {
  fontSize: 60,
  lineHeight: 1,
},
};
