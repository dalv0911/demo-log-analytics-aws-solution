package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/joho/godotenv"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/firehose"
)

type FakeLog struct {
	UserID    int    `json:"user_id"`
	MovieID   int    `json:"movie_id"`
	Category  string `json:"category"`
	SampledAt string `json:"sampled_at"`
}

func main() {
	log.Println("Start sending fake logs to Firehose...")

	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	sess := session.Must(session.NewSession())
	firehoseClient := firehose.New(sess, aws.NewConfig().WithRegion(os.Getenv("AWS_REGION")))

	recordsBatchInput := &firehose.PutRecordBatchInput{}
	recordsBatchInput = recordsBatchInput.SetDeliveryStreamName("david-demo-analytical-stream")

	const maxUint = 4294967295

	log.Println("Generating fake logs...")
	records := []*firehose.Record{}
	for i := 0; i < 10; i++ {
		data := FakeLog{
			UserID:    rand.Intn(maxUint),
			MovieID:   rand.Intn(maxUint),
			Category:  fmt.Sprintf("Sample category %d", rand.Intn(maxUint)),
			SampledAt: time.Now().Format(time.RFC3339),
		}

		b, err := json.Marshal(data)

		if err != nil {
			log.Printf("Error: %v", err)
			os.Exit(1)
		}

		record := &firehose.Record{Data: b}
		records = append(records, record)
	}

	recordsBatchInput = recordsBatchInput.SetRecords(records)

	resp, err := firehoseClient.PutRecordBatch(recordsBatchInput)
	if err != nil {
		fmt.Printf("PutRecordBatch returns an error: %v\n", err)
	} else {
		fmt.Printf("Successfully sent data to Kinesis Firehose with response: %v\n", resp)
	}

	log.Println("✅ Done.")
}
