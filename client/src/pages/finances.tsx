import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function Finances() {
  const { data: transactions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: recurring } = useQuery<any[]>({
    queryKey: ["/api/transactions", "recurring"],
  });

  const totalIncome = transactions?.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const totalExpenses = transactions?.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const balance = totalIncome - totalExpenses;

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-finances-title">
              Finances
            </h1>
            <p className="text-muted-foreground">
              Track income, expenses, and recurring payments
            </p>
          </div>
          <Button size="sm" data-testid="button-add-transaction">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-chart-2" />
                <span className="text-2xl font-semibold font-mono" data-testid="text-total-income">
                  ${totalIncome.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-destructive" />
                <span className="text-2xl font-semibold font-mono" data-testid="text-total-expenses">
                  ${totalExpenses.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`text-2xl font-semibold font-mono ${balance >= 0 ? 'text-chart-2' : 'text-destructive'}`} data-testid="text-balance">
                ${balance.toFixed(2)}
              </span>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">
              All Transactions
            </TabsTrigger>
            <TabsTrigger value="recurring" data-testid="tab-recurring">
              Recurring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : transactions && transactions.length > 0 ? (
              transactions.map((transaction) => (
                <Card key={transaction.id} data-testid={`card-transaction-${transaction.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {transaction.description || transaction.category || "Transaction"}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {format(new Date(transaction.date), "MMMM d, yyyy")}
                          {transaction.category && ` • ${transaction.category}`}
                        </CardDescription>
                        {transaction.associatedModule && (
                          <Badge variant="secondary" className="mt-1">
                            {transaction.associatedModule}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-semibold font-mono ${
                          transaction.type === "income" ? "text-chart-2" : "text-destructive"
                        }`}>
                          {transaction.type === "income" ? "+" : "-"}${parseFloat(transaction.amount).toFixed(2)}
                        </div>
                        <Badge variant={transaction.recurring ? "default" : "outline"} className="mt-1">
                          {transaction.recurring ? "Recurring" : "One-time"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking your income and expenses
                </p>
                <Button data-testid="button-create-transaction">
                  Add Transaction
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recurring" className="space-y-3 mt-6">
            {recurring && recurring.length > 0 ? (
              recurring.map((transaction) => (
                <Card key={transaction.id} data-testid={`card-recurring-${transaction.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {transaction.description || transaction.category || "Recurring Payment"}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {transaction.category}
                        </CardDescription>
                      </div>
                      <div className={`text-xl font-semibold font-mono ${
                        transaction.type === "income" ? "text-chart-2" : "text-destructive"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}${parseFloat(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No recurring payments</h3>
                <p className="text-sm text-muted-foreground">
                  Add recurring income or expenses
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
