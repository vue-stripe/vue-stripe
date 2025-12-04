'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from '@/components/copy-button'
import { CheckCircle2 } from 'lucide-react'

interface ResultField {
  label: string
  value: string
  copyable?: boolean
}

interface ResultDisplayProps {
  title?: string
  fields: ResultField[]
}

export function ResultDisplay({ title = 'Result', fields }: ResultDisplayProps) {
  return (
    <Card className="border-vue-green/30 bg-vue-green/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-vue-green">
          <CheckCircle2 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={index}
            className="flex items-start justify-between gap-4 rounded-md border bg-background p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">
                {field.label}
              </p>
              <p className="mt-1 break-all font-mono text-sm">{field.value}</p>
            </div>
            {field.copyable !== false && (
              <CopyButton value={field.value} className="shrink-0" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
