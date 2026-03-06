with open('d:/College/Projects/kinetik/app/(protected)/organizer/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('<button className=\"p-2.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm\">', '<button onClick={() => handleApplicationAction(app.event_id, app.volunteer_id, \"ACCEPTED\")} className=\"p-2.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm\">')
text = text.replace('<CheckCircle2 className=\"h-5 w-5\" />\n                        </button>', '<CheckCircle2 className=\"h-5 w-5\" />\n                        </button>\n                        <button onClick={() => handleApplicationAction(app.event_id, app.volunteer_id, \"REJECTED\")} className=\"p-2.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all shadow-sm\">\n                          <XCircle className=\"h-5 w-5\" />\n                        </button>')

with open('d:/College/Projects/kinetik/app/(protected)/organizer/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)