import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { twMerge } from 'tailwind-merge'
import { CheckIcon } from 'lucide-react'

interface CheckboxProps extends RadixCheckbox.CheckboxProps {}

export function Checkbox(props: CheckboxProps) {
  return (
    <RadixCheckbox.Root
      className={twMerge(
        'flex size-4 shrink-0 items-center justify-center rounded border border-zinc-600 bg-zinc-800 transition-colors duration-150',
        'data-[state=checked]:bg-indigo-400 data-[state=checked]:border-indigo-400',
        'hover:border-zinc-500',
        'focus-within:outline-0 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
      )}
      {...props}
    >
      <RadixCheckbox.Indicator className="flex items-center justify-center text-zinc-900">
        <CheckIcon className="size-3" strokeWidth={3} />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}
