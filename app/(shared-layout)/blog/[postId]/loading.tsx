import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingPage(){
    return (
        <div className="mx-w-3xl mx-auto py-8 px-4">
            <Skeleton className="h-10 w-24 mb-6" />
            <Skeleton className="h-100 w-full mb-8 rounded-xl" />
            
            <div className="space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-4 w-32" />
            </div>

            <div className="mt-8 space-y-2">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-2/3" />
            </div>


        </div>
    );
}