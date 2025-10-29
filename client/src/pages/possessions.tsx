import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Home as HomeIcon, Shirt, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Possessions() {
  const { data: possessions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/possessions"],
  });

  const { data: outfits } = useQuery<any[]>({
    queryKey: ["/api/outfits"],
  });

  const clothing = possessions?.filter(p => p.category === "clothing") || [];
  const wishlist = possessions?.filter(p => p.wishlist) || [];
  const inventory = possessions?.filter(p => !p.wishlist) || [];

  const laundryStatusColors = {
    clean: "default",
    second_wear: "secondary",
    dirty: "destructive",
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-possessions-title">
              Possessions
            </h1>
            <p className="text-muted-foreground">
              Track inventory, clothing, outfits, and wishlist
            </p>
          </div>
          <Button size="sm" data-testid="button-add-possession">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <Tabs defaultValue="inventory">
          <TabsList>
            <TabsTrigger value="inventory" data-testid="tab-inventory">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="clothing" data-testid="tab-clothing">
              Clothing & Outfits
            </TabsTrigger>
            <TabsTrigger value="wishlist" data-testid="tab-wishlist">
              Wishlist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : inventory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((item) => (
                  <Card key={item.id} data-testid={`card-item-${item.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {item.category}
                          </CardDescription>
                        </div>
                        <HomeIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    {item.value && (
                      <CardContent>
                        <p className="text-sm font-mono">
                          Value: ${parseFloat(item.value).toFixed(2)}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <HomeIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No items in inventory</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking your possessions
                </p>
                <Button data-testid="button-create-item">
                  Add Item
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="clothing" className="space-y-6 mt-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Clothing Items</h2>
              {clothing.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {clothing.map((item) => (
                    <Card key={item.id} data-testid={`card-clothing-${item.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-sm">{item.name}</CardTitle>
                          </div>
                          <Shirt className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        {item.laundryStatus && (
                          <Badge variant={laundryStatusColors[item.laundryStatus as keyof typeof laundryStatusColors]}>
                            {item.laundryStatus.replace('_', ' ')}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No clothing items. Add items with category "clothing" to see them here.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Outfits</h2>
                <Button size="sm" data-testid="button-create-outfit">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Outfit
                </Button>
              </div>
              {outfits && outfits.length > 0 ? (
                <div className="space-y-3">
                  {outfits.map((outfit) => (
                    <Card key={outfit.id} data-testid={`card-outfit-${outfit.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Outfit for {outfit.date}
                          </CardTitle>
                          <Badge variant="outline">
                            {outfit.itemIds?.length || 0} items
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No outfits created yet
                </p>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>Most worn items and streaks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  Usage stats will be implemented in integration phase
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wishlist" className="space-y-4 mt-6">
            {wishlist.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlist.map((item) => (
                  <Card key={item.id} data-testid={`card-wishlist-${item.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {item.category}
                          </CardDescription>
                        </div>
                        <Heart className="w-5 h-5 text-destructive" />
                      </div>
                    </CardHeader>
                    {item.value && (
                      <CardContent>
                        <p className="text-sm font-mono">
                          Target: ${parseFloat(item.value).toFixed(2)}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No items in wishlist</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add items you want to acquire
                </p>
                <Button data-testid="button-create-wishlist-item">
                  Add to Wishlist
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
