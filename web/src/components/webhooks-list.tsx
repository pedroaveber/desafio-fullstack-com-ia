import { WebhooksListItem } from './webhooks-list-item'
import * as Dialog from '@radix-ui/react-dialog'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { webhookListSchema } from '../http/schemas/webhooks'
import { Loader2Icon, Wand2Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CodeBlock } from './ui/code-block'

export function WebhooksList() {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const intersectionObserver = useRef<IntersectionObserver | null>(null)

  const [checkedWebhooksIds, setCheckedWebhooksIds] = useState<string[]>([])
  const [generatedHandlerCode, setGeneratedHandlerCode] = useState<string | null>(null)

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery({
      queryKey: ['webhooks'],
      queryFn: async ({ pageParam }) => {
        const url = new URL('http://localhost:3333/api/webhooks')

        if (pageParam) {
          url.searchParams.set('cursor', pageParam)
        }

        const response = await fetch(url)
        const data = await response.json()

        return webhookListSchema.parse(data)
      },
      getNextPageParam: (lastPage) => {
        return lastPage.nextCursor ?? undefined
      },
      initialPageParam: undefined as string | undefined,
    })

  function handleWebhookChecked(webhookId: string) {
    const isChecked = checkedWebhooksIds.includes(webhookId)

    if (isChecked) {
      setCheckedWebhooksIds((prev) => prev.filter((id) => id !== webhookId))
    } else {
      setCheckedWebhooksIds((prev) => [...prev, webhookId])
    }
  }

  async function handleGenerateHandler() {
    const response = await fetch('http://localhost:3333/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ webhookIds: checkedWebhooksIds }),
    })

    type GenerateResponse = {
      code: string
    }

    const data = await response.json() as GenerateResponse
    setGeneratedHandlerCode(data.code)
  }

  const webhooks = data.pages.flatMap((page) => page.webhooks)
  const hasAnyWebhookChecked = checkedWebhooksIds.length > 0

  useEffect(() => {
    if (intersectionObserver.current) {
      intersectionObserver.current.disconnect()
    }

    intersectionObserver.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]

        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      {
        threshold: 0.1,
      },
    )

    if (loadMoreRef.current) {
      intersectionObserver.current.observe(loadMoreRef.current)
    }

    return () => {
      if (intersectionObserver.current) {
        intersectionObserver.current.disconnect()
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 p-2">
            <div className='w-full px-3 py-2'>
              <button
                onClick={handleGenerateHandler}
                disabled={isFetchingNextPage || hasAnyWebhookChecked === false}
                className='w-full flex px-3 justify-center items-center disabled:bg-zinc-600 gap-2 bg-indigo-400 text-white h-8 rounded-full disabled:opacity-50'>
                <Wand2Icon className='size-4 text-white' />
                  Gerar handler
              </button>
            </div>
          {webhooks.map((webhook) => (
            <WebhooksListItem
              key={webhook.id}
              webhook={webhook}
              isWebhookChecked={checkedWebhooksIds.includes(webhook.id)}
              onWebhookChecked={handleWebhookChecked}
            />
          ))}
        </div>

        {hasNextPage && (
          <div className="p-2" ref={loadMoreRef}>
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 py-4">
                <Loader2Icon className="size-5 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {!!generatedHandlerCode && (
        <Dialog.Root defaultOpen>
          <Dialog.Overlay className="bg-black/60 inset-0 fixed z-20" />

          <Dialog.Content className="flex items-center justify-center fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 z-40">
            <div className="bg-zinc-900 w-150 p-4 rounded-lg border border-zinc-800 max-h-155 overflow-y-auto">
              <CodeBlock language="typescript" code={generatedHandlerCode} />
            </div>
          </Dialog.Content>
        </Dialog.Root>
      )}
    </>
  )
}
