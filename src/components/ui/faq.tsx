import type { ComponentProps, ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface FaqItem {
  /** React key and accordion value; falls back to `item-<index>`. */
  id?: string;
  question: ReactNode;
  answer: ReactNode;
}

interface FaqProps extends Omit<ComponentProps<'section'>, 'title' | 'defaultValue'> {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  items: FaqItem[];
  /** "split": header left, questions right on large screens. "stacked": centred header above. */
  layout?: 'stacked' | 'split';
  /** "single" keeps one answer open at a time; "multiple" lets several stay open. */
  type?: 'single' | 'multiple';
  /** Item value(s) open on first render: an item's `id`, or `item-<index>`. */
  defaultValue?: string | string[];
  /** Shown under the header, e.g. a link to all questions. */
  footer?: ReactNode;
}

/**
 * Frequently-asked-questions section: a header and the questions in an accordion.
 * Adapted from a shadcn-style component to GMM tokens and the page container.
 * The title is an `<h2>`; each question is a button inside an `<h3>` (Radix), reachable
 * with Tab and toggled with Enter/Space, with Up/Down/Home/End moving between questions.
 */
function Faq({
  className,
  eyebrow = 'FAQ',
  title = 'Pertanyaan Umum',
  description,
  items,
  layout = 'split',
  type = 'single',
  defaultValue,
  footer,
  ...props
}: FaqProps) {
  const split = layout === 'split';
  const hasHeader = eyebrow != null || title != null || description != null || footer != null;

  const entries = items.map((item, index) => (
    <AccordionItem key={item.id ?? index} value={item.id ?? `item-${index}`} data-slot="faq-item">
      <AccordionTrigger data-slot="faq-question" className="text-base md:text-[17px]">
        {item.question}
      </AccordionTrigger>
      <AccordionContent
        data-slot="faq-answer"
        className="text-fg-secondary text-[15px] leading-relaxed"
      >
        {item.answer}
      </AccordionContent>
    </AccordionItem>
  ));

  const listClassName = cn(
    'border-line w-full border-t',
    !split && 'mx-auto max-w-3xl',
    !split && hasHeader && 'mt-10',
  );

  return (
    <section data-slot="faq" data-layout={layout} className={cn('section', className)} {...props}>
      <div
        data-slot="faq-container"
        className={cn('container-page', split && 'grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16')}
      >
        {hasHeader ? (
          <div data-slot="faq-header" className={cn('max-w-xl', !split && 'mx-auto text-center')}>
            {eyebrow != null && (
              <p className="text-primary text-sm font-semibold tracking-wide uppercase">
                {eyebrow}
              </p>
            )}
            {title != null && (
              <h2
                className={cn(
                  'text-[28px] font-bold tracking-tight text-balance md:text-[32px]',
                  eyebrow != null && 'mt-2',
                )}
              >
                {title}
              </h2>
            )}
            {description != null && (
              <p className="text-fg-muted mt-3 text-base text-pretty md:text-lg">{description}</p>
            )}
            {footer != null && <div className="text-fg-muted mt-6 text-sm">{footer}</div>}
          </div>
        ) : null}
        {type === 'multiple' ? (
          <Accordion
            type="multiple"
            className={listClassName}
            defaultValue={
              defaultValue === undefined
                ? undefined
                : Array.isArray(defaultValue)
                  ? defaultValue
                  : [defaultValue]
            }
          >
            {entries}
          </Accordion>
        ) : (
          <Accordion
            type="single"
            collapsible
            className={listClassName}
            defaultValue={Array.isArray(defaultValue) ? defaultValue[0] : defaultValue}
          >
            {entries}
          </Accordion>
        )}
      </div>
    </section>
  );
}

export { Faq, type FaqItem, type FaqProps };
export default Faq;
