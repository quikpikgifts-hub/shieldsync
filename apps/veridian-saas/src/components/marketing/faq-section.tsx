import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqs } from "@/data/site";

export function FaqSection() {
  return (
    <Accordion type="single" collapsible className="mx-auto w-full max-w-3xl">
      {faqs.map((faq, i) => (
        <AccordionItem key={faq.q} value={`item-${i}`}>
          <AccordionTrigger>{faq.q}</AccordionTrigger>
          <AccordionContent>{faq.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
