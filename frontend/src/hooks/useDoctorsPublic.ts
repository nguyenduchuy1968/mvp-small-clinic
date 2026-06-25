import { useQuery } from "@tanstack/react-query"

import { DoctorsService } from "@/client"

export function useDoctorsPublic() {
  return useQuery({
    queryFn: () => DoctorsService.readDoctorsPublic({ skip: 0, limit: 100 }),
    queryKey: ["doctors", "public"],
  })
}
