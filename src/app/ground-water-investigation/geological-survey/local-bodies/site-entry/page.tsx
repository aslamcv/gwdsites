'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useLsgdData } from '@/hooks/use-lsgd-data';

const reportSchema = z.object({
  nameOfSite: z.string().min(1, 'Name of site is required.'),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  fileNo: z.string().optional(),
  village: z.string().optional(),
  ward: z.string().optional(),
  altitude: z.string().optional(),
  lsgd: z.string().optional(),
  assembly: z.string().optional(),
  block: z.string().optional(),
  typeAppliedFor: z.enum(['openwell', 'borewell']).optional(),
  dateOfInvestigation: z.string().optional(),
  dateOfFeasibility: z.string().optional(),
  noOfBeneficiaries: z.string().optional(),
  toposheet: z.string().optional(),
  reference: z.string().optional(),
  hydrogeology: z.string().optional(),
  borewellTotalDepth: z.string().optional(),
  noNearbyBorewells: z.boolean().default(false),
  openwellTotalDepth: z.string().optional(),
  openwellWaterLevel: z.string().optional(),
  openwellParapetHeight: z.string().optional(),
  noNearbyOpenwells: z.boolean().default(false),
  recommendationBorewell: z.string().optional(),
  recommendationOpenwell: z.string().optional(),
  recBorewellTotalDepth: z.string().optional(),
  recBorewellDiameter: z.string().optional(),
  expectedOverburden: z.string().optional(),
  recOpenwellTotalDepth: z.string().optional(),
  recOpenwellDiameter: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

const borewellDiameterOptions = [
  { value: '110mm', label: '110mm (4.5")' },
  { value: '150mm', label: '150mm (6")' },
  { value: '200mm', label: '200mm (8")' },
];

const openwellDiameterOptions = Array.from({ length: 11 }, (_, i) => {
  const val = (1 + i * 0.5).toString();
  return { value: val, label: `${val}m` };
});

const blockOptions = [
  "Areekode — Safe (68.15%)",
  "Perumpadappu Block — Safe(68.88%)",
  "Kalikavu — Safe(60.31%)",
  "Kondotty — Semi-Critical(88.45%)",
  "Kuttippuram— Semi-Critical(84.68%)",
  "Malappuram— Semi-Critical(79.54%)",
  "Mankada— Semi-Critical(75.36%)",
  "Nilambur— Safe(56.59%)",
  "Perinthalmanna— Safe(65.38%)",
  "Ponnani— Safe(64.14%)",
  "Tanur— Semi-Critical(88.61%)",
  "Tirur— Semi-Critical(86.75%)",
  "Tirurangadi— Semi-Critical(85.41%)",
  "Vengara Block— Semi-Critical(86.12%)",
  "Wandoor— Safe(61.04%)"
];

const villageOptions = [
  { label: "Eranad Taluk", options: ["Anakkayam", "Areacode", "Chembrasseri", "Cheekode", "Edavanna", "Elankur", "Karakunnu", "Kavanur", "Keezhuparamba", "Kizhuparamba", "Kodur", "Malappuram", "Manjeri", "Melmuri", "Narukara", "Panakkad", "Pandikkad", "Payyanad", "Perakamanna", "Pookkottur", "Pulpatta", "Trikkalangode", "Urangattiri", "Vettilappara", "Vettikattiri"] },
  { label: "Nilambur Taluk", options: ["Akampadam", "Amarambalam", "Chungathara", "Edakkara", "Karulai", "Karuvarakundu", "Kalikavu", "Mampad", "Moothedam", "Nilambur", "Pothukal", "Vazhikkadavu", "Chokkad", "Edakkara (Part)"] },
  { label: "Perinthalmanna Taluk", options: ["Aliparamba", "Angadippuram", "Anamangad", "Arakkuparamba", "Edappatta", "Elamkulam", "Keezhattur", "Koottilangadi", "Kuruva", "Kuruvambalam", "Makkaraparamba", "Mankada", "Melattur", "Moorkkanad", "Nenmini", "Puzhakkattiri", "Thazhekkode", "Vadakkangara", "Valambur", "Vettathur"] },
  { label: "Tirur Taluk", options: ["Ananthavoor", "Athavanad", "Cheriyamundam", "Edayur", "Irimbiliyam", "Kalady", "Kalpakanchery", "Kattipparuthi", "Kurumbathur", "Kuttippuram", "Mangalam", "Marakkara", "Naduvattom", "Ponmala", "Thirunavaya", "Triprangode", "Valavannur"] },
  { label: "Tirurangadi Taluk", options: ["Thenhipalam", "Chelembra", "Cherukavu", "Moonniyur", "Nannambra", "Neduva", "Oorakam", "Parappanangadi", "Parappur", "Peruvallur", "Vallikkunnu", "Vengara", "Velimukku", "Ponmundam", "Tanalur", "Tirurangadi", "Kottakkal"] },
  { label: "Ponnani Taluk", options: ["Alamkode", "Edappal", "Marancheri", "Nannammukku", "Perumpadappa", "Ponnani Nagaram", "Tavanur", "Vattamkulam", "Veliyankode", "Kalady (Part)", "Edappal (Part)", "Marancheri (Part)"] },
  { label: "Kondotty Taluk", options: ["Chelembra (Part)", "Cherukavu (Part)", "Edarikkode", "Kizhisseri", "Kondotty", "Kuzhimanna", "Morayur", "Muthuvallur", "Nediyiruppu", "Pallikkal", "Pulikkal", "Vazhakkad", "Vazhayur"] },
  { label: "Remaining Revenue Villages", options: ["Kerala Estate", "Kurumbalangode", "Kurumbilangode", "Vellayur", "Naduvattom (Part)", "Perinthalmanna (Town)", "Tanur", "Thanoor", "Koottilangadi (Part)", "Ponnani (Part)", "Malappuram (Part)", "Manjeri (Part)", "Nilambur (Part)", "Kondotty (Part)", "Tirur (Part)", "Tirurangadi (Part)", "Perinthalmanna (Part)", "Karuvarakundu (Part)", "Amarambalam (Part)", "Vazhikkadavu (Part)"] }
];

export default function LocalBodiesGeologicalSurveySiteEntryPage() {
  const { toast } = useToast();
  const { lsgs, constituencies } = useLsgdData();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      nameOfSite: '', address: '', latitude: '', longitude: '', fileNo: '', village: '', ward: '', altitude: '', lsgd: '', assembly: '', block: '', dateOfInvestigation: new Date().toISOString().split('T')[0], dateOfFeasibility: '', noOfBeneficiaries: '', toposheet: '', reference: '', hydrogeology: 'The area is expected to be underlain by Lateritic soil followed by Laterite, weathered and hard crystalline rock.', borewellTotalDepth: '', noNearbyBorewells: false, openwellTotalDepth: '', openwellWaterLevel: '', openwellParapetHeight: '', noNearbyOpenwells: false, recommendationBorewell: '', recommendationOpenwell: '', recBorewellTotalDepth: '', recBorewellDiameter: '', expectedOverburden: '', recOpenwellTotalDepth: '', recOpenwellDiameter: '',
    },
  });

  const onSubmit = (data: ReportFormValues) => {
    toast({ title: 'Report Saved', description: 'The Local Bodies Groundwater Investigation Report has been successfully saved.' });
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ground-water-investigation/geological-survey/local-bodies">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
            <h1 className="font-headline text-xl font-bold tracking-tight text-foreground">Local Bodies Groundwater Investigation Report</h1>
            <p className="text-sm text-muted-foreground">Groundwater Department, Malappuram</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField control={form.control} name="nameOfSite" render={({ field }) => ( <FormItem> <FormLabel>1. Name of Site</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>2. Address</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="latitude" render={({ field }) => ( <FormItem> <FormLabel>3. Latitude</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="longitude" render={({ field }) => ( <FormItem> <FormLabel>4. Longitude</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="fileNo" render={({ field }) => ( <FormItem> <FormLabel>5. File No</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="village" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>6. Village</FormLabel> 
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Village" /></SelectTrigger></FormControl>
                      <SelectContent className="max-h-[400px]">
                        {villageOptions.map((group) => (
                          <SelectGroup key={group.label}>
                            <SelectLabel className="text-primary font-bold">{group.label}</SelectLabel>
                            {group.options.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select> 
                    <FormMessage /> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="ward" render={({ field }) => ( <FormItem> <FormLabel>7. Ward</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="altitude" render={({ field }) => ( <FormItem> <FormLabel>8. Altitude</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="lsgd" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>9. LSGD</FormLabel> 
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={lsgs.length > 0 ? "Select LSGD" : "Import in Settings"} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {lsgs.map((lsg) => (<SelectItem key={lsg} value={lsg}>{lsg}</SelectItem>))}
                      </SelectContent>
                    </Select> 
                    <FormMessage /> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="assembly" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>10. Constituency (LAC)</FormLabel> 
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={constituencies.length > 0 ? "Select Constituency" : "Import in Settings"} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {constituencies.map((lac) => (<SelectItem key={lac} value={lac}>{lac}</SelectItem>))}
                      </SelectContent>
                    </Select> 
                    <FormMessage /> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="block" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>11. Block</FormLabel> 
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Block" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {blockOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                      </SelectContent>
                    </Select> 
                    <FormMessage /> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="typeAppliedFor" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>12. Type Applied For</FormLabel> 
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="openwell" /></FormControl>
                        <FormLabel className="font-normal">Openwell</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="borewell" /></FormControl>
                        <FormLabel className="font-normal">Borewell</FormLabel>
                      </FormItem>
                    </RadioGroup> 
                    <FormMessage /> 
                  </FormItem> 
                )} />
                <FormField control={form.control} name="dateOfInvestigation" render={({ field }) => ( <FormItem> <FormLabel>13. Date of Investigation</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="dateOfFeasibility" render={({ field }) => ( <FormItem> <FormLabel>14. Date of Feasibility</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="noOfBeneficiaries" render={({ field }) => ( <FormItem> <FormLabel>15. No. of Beneficiaries</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="toposheet" render={({ field }) => ( <FormItem> <FormLabel>16. Toposheet/GW Prospect Map</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="reference" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>17. Reference</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </div>
            </CardContent>
          </Card>

          <Card> 
            <CardHeader><CardTitle>18. Hydrogeology & Geology of the area</CardTitle></CardHeader> 
            <CardContent> 
              <FormField control={form.control} name="hydrogeology" render={({ field }) => ( 
                <FormItem><FormControl><Textarea rows={5} {...field} /></FormControl> <FormMessage /> </FormItem> 
              )} /> 
            </CardContent> 
          </Card>

          <Card> 
            <CardHeader><CardTitle>19. Details of nearby groundwater structures</CardTitle></CardHeader> 
            <CardContent className="space-y-6"> 
              <div> 
                <h4 className="font-medium mb-2">Borewell</h4> 
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center"> 
                  <FormField control={form.control} name="borewellTotalDepth" render={({ field }) => ( <FormItem> <FormLabel>Total Depth</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} /> 
                  <FormField control={form.control} name="noNearbyBorewells" render={({ field }) => ( 
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-8"> 
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl>
                      <FormLabel className="font-normal">There is no nearby borewells</FormLabel>
                    </FormItem> 
                  )} /> 
                </div> 
              </div> 
              <div> 
                <h4 className="font-medium mb-2">Openwell</h4> 
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center"> 
                  <FormField control={form.control} name="openwellTotalDepth" render={({ field }) => ( <FormItem> <FormLabel>Total Dept</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} /> 
                  <FormField control={form.control} name="openwellWaterLevel" render={({ field }) => ( <FormItem> <FormLabel>Water level</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} /> 
                  <FormField control={form.control} name="openwellParapetHeight" render={({ field }) => ( <FormItem> <FormLabel>Parapet Height</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} /> 
                  <FormField control={form.control} name="noNearbyOpenwells" render={({ field }) => ( 
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-8"> 
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl>
                      <FormLabel className="font-normal">There is no nearby open wells</FormLabel>
                    </FormItem> 
                  )} /> 
                </div> 
              </div> 
            </CardContent> 
          </Card>

          <Card> 
            <CardHeader><CardTitle>20. Recommendation</CardTitle></CardHeader> 
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8"> 
              <div className="space-y-4"> 
                <h4 className="font-bold text-lg text-primary border-b pb-2">For Borewell</h4> 
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                  <FormField control={form.control} name="recBorewellTotalDepth" render={({ field }) => ( <FormItem> <FormLabel>Recommended total depth (m)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} /> 
                  <FormField control={form.control} name="recBorewellDiameter" render={({ field }) => ( 
                    <FormItem>
                      <FormLabel>Recommended diameter</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select diameter" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {borewellDiameterOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem> 
                  )} /> 
                  <FormField control={form.control} name="expectedOverburden" render={({ field }) => ( <FormItem className="sm:col-span-2"> <FormLabel>Expected Overburden Thickness (m)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} /> 
                </div> 
                <FormField control={form.control} name="recommendationBorewell" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>Additional Borewell Details & Location</FormLabel> 
                    <FormControl><Textarea rows={4} {...field} /></FormControl> 
                    <FormMessage /> 
                  </FormItem> 
                )} /> 
              </div> 
              <div className="space-y-4 border-l pl-0 md:pl-8"> 
                <h4 className="font-bold text-lg text-primary border-b pb-2">For Open well</h4> 
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                  <FormField control={form.control} name="recOpenwellTotalDepth" render={({ field }) => ( <FormItem> <FormLabel>Recommended total depth (m)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} /> 
                  <FormField control={form.control} name="recOpenwellDiameter" render={({ field }) => ( 
                    <FormItem>
                      <FormLabel>Recommended diameter</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select diameter" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {openwellDiameterOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem> 
                  )} /> 
                </div> 
                <FormField control={form.control} name="recommendationOpenwell" render={({ field }) => ( 
                  <FormItem> 
                    <FormLabel>Additional Open Well Details & Location</FormLabel> 
                    <FormControl><Textarea rows={4} {...field} /></FormControl> 
                    <FormMessage /> 
                  </FormItem> 
                )} /> 
              </div> 
            </CardContent> 
          </Card>
          <div className="flex justify-end"> <Button type="submit"> <Save className="mr-2 h-4 w-4" /> Save Report </Button> </div>
        </form>
      </Form>
    </div>
  );
}
