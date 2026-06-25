import { useQuery } from "@tanstack/react-query"

import { DoctorsService } from "@/client"

export function useDoctors() {
  return useQuery({
    queryFn: () => DoctorsService.readDoctors({ skip: 0, limit: 100 }),
    queryKey: ["doctors"],
  })
}
