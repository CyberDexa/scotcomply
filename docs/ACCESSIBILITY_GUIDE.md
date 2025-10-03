# ♿ Accessibility Guide

**Date**: October 3, 2025  
**Platform**: ScotComply - WCAG 2.1 AA Compliance

---

## 🎯 Accessibility Standards

### Target: WCAG 2.1 Level AA
- ✅ Perceivable: Information presentable to all users
- ✅ Operable: Interface usable by all users
- ✅ Understandable: Content is clear and predictable
- ✅ Robust: Compatible with assistive technologies

---

## 📊 Current Accessibility Status

### Components Using shadcn/ui
- ✅ Built-in ARIA labels
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader support

### Areas Needing Improvement
- 🔄 Custom form labels
- 🔄 Error message announcements
- 🔄 Loading state announcements
- 🔄 Dynamic content updates
- 🔄 Skip navigation links

---

## 🛠️ Implementation Guide

### 1. Semantic HTML

#### Best Practices
```tsx
// ✅ Good: Semantic elements
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Property Details</h1>
    <section aria-labelledby="certificates">
      <h2 id="certificates">Certificates</h2>
    </section>
  </article>
</main>

<footer>
  <p>© 2025 ScotComply</p>
</footer>

// ❌ Avoid: Div soup
<div>
  <div>
    <div>Content</div>
  </div>
</div>
```

---

### 2. Keyboard Navigation

#### Implementation Checklist
- [x] All interactive elements focusable
- [x] Logical tab order
- [x] Visible focus indicators
- [x] Keyboard shortcuts (⌘K for search)
- [ ] Skip to main content link
- [ ] Focus trap in modals
- [ ] Escape key closes dialogs

#### Focus Management
```tsx
// Auto-focus on modal open
const SearchModal = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  
  return (
    <Dialog>
      <input 
        ref={inputRef}
        aria-label="Search properties, certificates, and more"
      />
    </Dialog>
  )
}
```

---

### 3. ARIA Labels & Roles

#### Common Patterns
```tsx
// Button with icon only
<button aria-label="Delete property">
  <TrashIcon />
</button>

// Loading indicator
<div role="status" aria-live="polite">
  Loading properties...
</div>

// Error message
<div role="alert" aria-live="assertive">
  Failed to save property
</div>

// Progress indicator
<div 
  role="progressbar" 
  aria-valuenow={75} 
  aria-valuemin={0} 
  aria-valuemax={100}
  aria-label="Upload progress"
>
  75% complete
</div>

// Breadcrumbs
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li aria-current="page">Property Details</li>
  </ol>
</nav>
```

---

### 4. Form Accessibility

#### Best Practices
```tsx
// Label association
<label htmlFor="property-address">
  Property Address
  <span aria-label="required">*</span>
</label>
<input 
  id="property-address"
  aria-required="true"
  aria-describedby="address-help"
/>
<p id="address-help">
  Enter the full property address including postcode
</p>

// Error state
<input 
  id="email"
  aria-invalid={errors.email ? 'true' : 'false'}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <p id="email-error" role="alert">
    {errors.email.message}
  </p>
)}

// Fieldset for related inputs
<fieldset>
  <legend>Contact Information</legend>
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
  
  <label htmlFor="phone">Phone</label>
  <input id="phone" type="tel" />
</fieldset>
```

---

### 5. Color Contrast

#### WCAG Requirements
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

#### Tailwind Classes (WCAG AA Compliant)
```tsx
// ✅ Good contrast
<p className="text-gray-900 bg-white">High contrast text</p>
<button className="bg-blue-600 text-white">Clear button</button>

// ⚠️ Check these
<p className="text-gray-400 bg-gray-100">Low contrast - avoid</p>
```

#### Tools
- Chrome DevTools Lighthouse
- axe DevTools browser extension
- Contrast checker: webaim.org/resources/contrastchecker/

---

### 6. Images & Alt Text

#### Guidelines
```tsx
// Informative images
<Image 
  src="/property.jpg" 
  alt="3-bedroom terraced house on High Street, Edinburgh"
  width={400}
  height={300}
/>

// Decorative images
<Image 
  src="/pattern.svg" 
  alt=""
  aria-hidden="true"
  width={100}
  height={100}
/>

// Complex images (charts)
<div>
  <Image 
    src="/compliance-chart.png" 
    alt="Compliance score trend showing 85% in January increasing to 92% in June"
  />
  <details>
    <summary>View data table</summary>
    <table>
      {/* Accessible data representation */}
    </table>
  </details>
</div>
```

---

### 7. Screen Reader Announcements

#### Live Regions
```tsx
// Success message
const [message, setMessage] = useState('')

const handleSave = async () => {
  await saveProperty()
  setMessage('Property saved successfully')
}

return (
  <>
    <div 
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
    <button onClick={handleSave}>Save Property</button>
  </>
)
```

#### Visually Hidden Class
```css
/* Add to globals.css */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

### 8. Skip Navigation

#### Implementation
```tsx
// Add to layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded"
        >
          Skip to main content
        </a>
        
        <Header />
        
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  )
}
```

---

### 9. Focus Indicators

#### Tailwind Configuration
```tsx
// Visible focus states
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click me
</button>

<Link 
  href="/dashboard" 
  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
>
  Dashboard
</Link>
```

---

### 10. Modal Accessibility

#### Focus Trap
```tsx
import { useEffect, useRef } from 'react'

const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    if (isOpen) {
      // Focus close button on open
      closeButtonRef.current?.focus()
      
      // Trap focus within modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
        
        if (e.key === 'Tab') {
          const focusable = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          const first = focusable?.[0] as HTMLElement
          const last = focusable?.[focusable.length - 1] as HTMLElement
          
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
      
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  return (
    <div 
      role="dialog" 
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
    >
      <h2 id="modal-title">Modal Title</h2>
      {children}
      <button ref={closeButtonRef} onClick={onClose}>
        Close
      </button>
    </div>
  )
}
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Navigate entire site using keyboard only
- [ ] Test with screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Check focus indicators are visible
- [ ] Verify all images have alt text
- [ ] Test forms with screen reader
- [ ] Check modal focus trap
- [ ] Test skip navigation
- [ ] Verify error announcements
- [ ] Check loading state announcements

### Automated Testing Tools
- [ ] Lighthouse accessibility audit (target: 95+)
- [ ] axe DevTools browser extension
- [ ] WAVE browser extension
- [ ] Pa11y CLI testing
- [ ] Jest + Testing Library (aria roles)

---

## 📊 Component Accessibility Checklist

### PropertyCard
- [x] Semantic HTML (article, header)
- [x] Keyboard accessible
- [ ] ARIA labels for icon buttons
- [ ] Focus indicators

### SearchBar
- [x] Label for input
- [x] Keyboard shortcuts
- [x] Focus management
- [ ] Screen reader announcements for results

### Dashboard
- [ ] Skip to main content
- [ ] Heading hierarchy (h1, h2, h3)
- [ ] ARIA labels for metrics
- [ ] Loading announcements

### Forms
- [ ] Associated labels
- [ ] Error announcements
- [ ] Required field indicators
- [ ] Help text associations

---

## 🎯 Priority Actions

### High Priority (Day 25)
1. Add skip navigation link
2. Add ARIA labels to icon buttons
3. Implement error announcements
4. Add loading state announcements
5. Test keyboard navigation

### Medium Priority (Day 26)
1. Audit color contrast
2. Review heading hierarchy
3. Add alt text to all images
4. Implement focus trap in modals
5. Test with screen reader

### Low Priority (Later)
1. Add keyboard shortcuts help
2. Implement reduced motion preferences
3. Add high contrast mode
4. Create accessibility statement

---

## 📈 Success Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Lighthouse Accessibility | 95+ | Chrome DevTools |
| axe violations | 0 | axe DevTools |
| Keyboard navigation | 100% | Manual testing |
| Screen reader compatibility | Full | VoiceOver/NVDA |
| Color contrast | WCAG AA | Contrast checker |

---

## 🔗 Resources

- WCAG 2.1 Guidelines: w3.org/WAI/WCAG21/quickref/
- MDN Accessibility: developer.mozilla.org/en-US/docs/Web/Accessibility
- A11y Project: a11yproject.com
- Inclusive Components: inclusive-components.design
- WebAIM: webaim.org

---

**Status**: 🚀 Ready to implement!
